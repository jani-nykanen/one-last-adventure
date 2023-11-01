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


const ATTACK_START_WAIT : number = 60;
const ATTACK_READY_WAIT : number = 30;


export class Hand extends Enemy {


    private posRef : Vector | undefined = undefined;
    private distance : number = 0;

    private attackWait : number = 0;
    private attackReady : number = 0;
    private attackType : AttackType = AttackType.Rush;
    private attacking : boolean = false;

    private rushWait : number = 0;
    private rushing : boolean = false;
    private rushTarget : Vector = new Vector();
    private basePos : Vector = new Vector();

    private frame : number = 0;


    protected init() : void {
        
        this.damage = 2;

        this.maxHealth = 1;

        this.hitbox = new Rectangle(0, 0, 16, 16);

        this.friction.x = 0;
        this.friction.y = 0.025;

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
        const ALT_SHOOT_SPEED_Y : number = -3.0;

        let dir : Vector;
        let angle : number;

        this.attacking = false;
        this.frame = 0;
        this.swapAttackType();

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
                ALT_SHOOT_SPEED_X*i, ALT_SHOOT_SPEED_Y, 2, 2, false, true);
        }
    }


    private rush(event : ProgramEvent) : void {

        const MIN_DIST : number = 4;
        const RUSH_SPEED : number = 2.0;
        const RETURN_SPEED : number = 1.0;
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
            }
            else {

                this.attacking = false;
                this.swapAttackType();

                this.pos = this.basePos.clone();
            }
        }

        this.frame = this.rushing ? 0 : 1;
    }


    protected playerEvent(player : Player, event : ProgramEvent): void {
        
        if (this.attacking)
            return;

        this.rushTarget = player.getPosition();
    }


    protected updateAI(event : ProgramEvent) : void {

        const TARGET_Y : number = 0.25;

        this.basePos.x = this.posRef.x + this.dir*this.distance;
        this.basePos.y = this.posRef.y;

        if (this.attacking) {

            switch (this.attackType) {

            case AttackType.Rush:

                this.rush(event);
                break;

            case AttackType.Shoot:

                this.shootBullets(event);
                break;

            default:
                break;
            }

            return;
        }

        this.pos.x = (this.posRef?.x ?? 0) + this.distance*this.dir;

        const ydir = Math.sign((this.posRef?.y ?? 0) - this.pos.y);
        this.target.y = ydir*TARGET_Y;

        if (this.attackReady > 0) {

            this.frame = this.attackType;

            this.attackReady -= event.tick;
            if (this.attackReady <= 0) {

                this.attacking = true;
                this.rushing = true;

                this.speed.zeros();
            }
        }
        else {

            this.frame = 0;

            this.attackWait -= event.tick;
            if (this.attackWait <= 0) {

                this.attackReady = ATTACK_READY_WAIT;
                this.attackWait = ATTACK_START_WAIT;
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
    }
}
