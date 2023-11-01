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


    private posRef : Vector | undefined = undefined;
    private distance : number = 0;

    private attackWait : number = 0;
    private attackReady : number = 0;
    private attackType : AttackType = AttackType.Rush;
    private attacking : boolean = false;

    private rushing : boolean = false;
    private rushTarget : Vector = new Vector();

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


    private rush(event : ProgramEvent) : void {

        const MIN_DIST : number = 4;

        const dist = Vector.distance(this.pos, this.rushTarget);

        if (this.rushing && dist < MIN_DIST) {

            this.rushing = false;
        }
    }


    protected playerEvent(player : Player, event : ProgramEvent): void {
        
        if (this.attacking)
            return;

        this.rushTarget = player.getPosition();
    }


    protected updateAI(event : ProgramEvent) : void {

        const TARGET_Y : number = 0.25;

        const ydir = Math.sign((this.posRef?.y ?? 0) - this.pos.y);
        
        this.pos.x = (this.posRef?.x ?? 0) + this.distance*this.dir;

        this.target.y = ydir*TARGET_Y;

        if (this.attacking) {

            switch (this.attackType) {

            case AttackType.Rush:

                this.rush(event);
                break;

            default:
                break;
            }

            return;
        }

        if (this.attackReady > 0) {

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
