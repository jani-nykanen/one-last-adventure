import { ProgramEvent } from "../../core/event.js";
import { Bitmap, Canvas, Flip } from "../../gfx/interface.js";
import { Rectangle } from "../../math/rectangle.js";
import { Vector } from "../../math/vector.js";
import { Player } from "../player.js";
import { TILE_WIDTH } from "../tilesize.js";
import { Enemy } from "./enemy.js";



const enum AttackType {

    Rush = 0,
    Shoot = 1
};


const ATTACK_START_WAIT : number = 120;
const ATTACK_READY_WAIT : number = 60;


export class Hand extends Enemy {


    private posRef : Vector = new Vector();
    private distance : number = 0;

    private attackWait : number = 0;
    private attackReady : number = 0;
    private attackType : AttackType = AttackType.Rush;
    private attacking : boolean = false;

    private phase : number = 0;
    private angle : number = 0;

    private rushWait : number = 0;
    private rushing : boolean = false;
    private rushTarget : Vector = new Vector();
    private basePos : Vector = new Vector();

    private frame : number = 0;


    protected init() : void {
        
        this.damage = 2;

        this.maxHealth = 1;

        this.hitbox = new Rectangle(0, 0, 16, 16);

        this.friction.x = 0.25;
        this.friction.y = 0.25;

        this.weight = 0;

        this.canBeHurt = false;
        this.canBeMoved = false;
        this.disableCollisions = true;
        this.getGravity = false;

        this.inCamera = true;
    }


    private swapAttackType() : void {

        this.attackType = Number(!Boolean(this.attackType)) as AttackType;
    }


    private shootBullets(event : ProgramEvent) : void {

        const BASE_SHOOT_SPEED : number = 2.0;
        const SHOOT_DIF : number = Math.PI/8;

        const ALT_SHOOT_SPEED_X : number = 0.5;
        const ALT_SHOOT_SPEED_Y : number = -3.5;
        const ALT_SHOOT_DELTA_Y : number = 0.25;

        let dir : Vector;
        let angle : number;

        this.attacking = false;
        this.frame = 0;
        this.swapAttackType();

        event.audio.playSample(event.assets.getSample("throw"), 0.60);

        if (this.dir < 0) {

            dir = Vector.direction(this.pos, this.rushTarget);
            angle = Math.atan2(dir.y, dir.x);

            for (let i = -1; i <= 1; ++ i) {

                dir.x = Math.cos(angle + i*SHOOT_DIF);
                dir.y = Math.sin(angle + i*SHOOT_DIF);

                this.projectiles.spawn(this.pos.x, this.pos.y,
                    dir.x*BASE_SHOOT_SPEED, dir.y*BASE_SHOOT_SPEED, 2, 2, false, false, false);
            }
            return;
        }

        for (let i = -2; i <= 2; ++ i) {

            this.projectiles.spawn(this.pos.x, this.pos.y,
                ALT_SHOOT_SPEED_X*i, 
                ALT_SHOOT_SPEED_Y + ALT_SHOOT_DELTA_Y*Math.sqrt(Math.abs(i)), 
                2, 2, false, true);
        }
    }


    private rush(event : ProgramEvent) : void {

        const MIN_DIST : number = 4;
        const RUSH_SPEED : number = 3.0;
        const RETURN_SPEED : number = 2.0;
        const RUSH_WAIT : number = 30;

        if (this.rushWait > 0) {

            this.rushWait -= event.tick;
            this.speed.zeros();
            return;
        }

        const target = this.rushing ? this.rushTarget : this.basePos;

        const dist = Vector.distance(this.pos, target);
        const dir = Vector.direction(this.pos, target);
        const speed = this.rushing ? RUSH_SPEED : RETURN_SPEED;

        this.speed.x = dir.x*speed;
        this.speed.y = dir.y*speed;

        if (dist < MIN_DIST) {

            if (this.rushing) {
                
                this.rushing = false;
                this.rushWait = RUSH_WAIT;

                event.audio.playSample(event.assets.getSample("magic_hit"), 0.50);
            }
            else {

                this.attacking = false;
                this.swapAttackType();

                this.pos = this.basePos.clone();
            }
        }

        this.frame = this.rushing ? 0 : 1;
    }


    private stomp(event : ProgramEvent) : void {

        const GRAVITY_TARGET : number = 8.0;
        const BOTTOM_DIF : number = 24;
        const STOMP_WAIT : number = 30;
        const RETURN_SPEED : number = 2.0;
        const MIN_DIST : number = 4;

        this.flip = Flip.Horizontal | Flip.Vertical;

        this.frame = 1;

        if (this.rushWait > 0) {

            this.rushWait -= event.tick;
            this.speed.zeros();
            return;
        }

        if (this.rushing) {

            this.friction.y = 0.5;
            this.target.y = GRAVITY_TARGET;

            if (this.pos.y >= event.screenHeight - BOTTOM_DIF) {

                this.pos.y = event.screenHeight - BOTTOM_DIF;
                this.speed.y = 0;
                this.rushWait = STOMP_WAIT;

                this.shakeCallback(4, 30);

                event.audio.playSample(event.assets.getSample("quake"), 0.55);

                this.rushing = false;

                for (let i = -2; i <= 2; ++ i) {

                    this.projectiles.spawn(this.pos.x, this.pos.y + 8,
                        i*1.0, -4.0 + Math.sqrt(Math.abs(i))*0.5, 
                        3, 2, false, true);
                }
            }
            return;
        }
       
        const dist = Vector.distance(this.pos, this.basePos);
        const dir = Vector.direction(this.pos, this.basePos);

        this.speed.x = dir.x*RETURN_SPEED;
        this.speed.y = dir.y*RETURN_SPEED;

        if (dist < MIN_DIST) {
            
            this.attacking = false;
            this.swapAttackType();

            this.pos = this.basePos.clone();

            this.flip = Flip.Horizontal;
        }
    }


    private computeBasePos() : void {

        if (this.phase == 0) {

            this.basePos.x = this.posRef.x + this.distance*this.dir;
            this.basePos.y = this.posRef.y + Math.sin(this.angle)*24;
            return;
        }

        this.basePos.x = this.posRef.x - Math.cos(this.angle)*this.distance;
        this.basePos.y = this.posRef.y - Math.sin(this.angle)*this.distance;
    }


    protected playerEvent(player : Player, event : ProgramEvent): void {
        
        if (this.attacking)
            return;

        this.rushTarget = player.getPosition();
    }


    protected updateAI(event : ProgramEvent) : void {

        const APPROACH_SPEED : number = 2.0;
        const ROTATION_SPEED : number = Math.PI*2/240;
        const MIN_DIST : number = 4.0;

        this.angle = (this.angle + ROTATION_SPEED*event.tick) % (Math.PI*2);

        this.computeBasePos();

        if (this.attacking) {

            switch (this.attackType) {

            case AttackType.Rush:

                if (this.dir < 0)
                    this.rush(event);
                else 
                    this.stomp(event);

                break;

            case AttackType.Shoot:

                this.shootBullets(event);
                break;

            default:
                break;
            }

            return;
        }

        let dir : Vector;
        let dist = Vector.distance(this.pos, this.basePos);

        if (dist < MIN_DIST) {

            this.pos.x = this.basePos.x;
            this.pos.y = this.basePos.y;

            this.target.zeros();
            this.speed.zeros();
        }
        else {
            
            dir = Vector.direction(this.pos, this.basePos);

            this.target.x = dir.x*APPROACH_SPEED;
            this.target.y = dir.y*APPROACH_SPEED;
        }

        if (this.attackReady > 0) {

            this.frame = this.attackType;

            this.attackReady -= event.tick;
            if (this.attackReady <= 0) {

                this.attacking = true;
                this.rushing = true;

                this.speed.zeros();

                if (this.attackType == AttackType.Rush) {

                    event.audio.playSample(event.assets.getSample("enemy_jump"), 0.50);
                }
            }
        }
        else {

            this.frame = 0;

            this.attackWait -= event.tick;
            if (this.attackWait <= 0) {

                this.attackReady = ATTACK_READY_WAIT;
                this.attackWait = ATTACK_START_WAIT;

                event.audio.playSample(event.assets.getSample("prepare"), 0.80);
            }
        }
    }


    public draw(canvas : Canvas, _? : Bitmap) : void {

        if (!this.exist)
            return;

        const dx = Math.round(this.pos.x) - 16;
        const dy = Math.round(this.pos.y) - 16;

        const bmp = canvas.getBitmap("final_boss");

        if (this.attackReady > 0 && Math.floor(this.attackReady/4) % 2 == 0) {

            canvas.setColor(255, 73, 73);
        }

        canvas.drawBitmap(bmp, this.flip, dx, dy, 64, this.frame*32, 32, 32);

        canvas.setColor();
    }


    public initialize(posRef : Vector, distance : number, flip : Flip, dir : -1 | 1) : void {

        this.posRef = posRef;
        this.distance = distance;
        this.flip = flip;

        this.dir = dir;

        this.attackType = dir == 1 ? AttackType.Shoot : AttackType.Rush;
        this.attackWait = ATTACK_START_WAIT + ((dir + 1)/2)*ATTACK_READY_WAIT*2;
        this.attackReady = 0;

        this.angle = (dir + 1)/2.0*Math.PI;
    }


    public activateSecondPhase() : void {

        this.phase = 1;
    }
}
