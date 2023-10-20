import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { TILE_WIDTH } from "../tilesize.js";
import { Enemy } from "./enemy.js";


const MOVE_SPEED : number = 0.65;


export class Ball extends Enemy {


    protected init() : void {
        
        const even = ((this.pos.x/TILE_WIDTH)) % 2 == 0;

        this.damage = 2;

        this.maxHealth = 5;

        this.friction.y = 0.1;

        this.collisionBox.w = 8;

        this.spr.setFrame(even ? 1 : 0, 11);
        this.dir = even ? 1 : -1;

        this.weight = 1.10;
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const JUMP_SPEED : number = -2.5;

        if (this.touchSurface) {

            this.spr.animate(this.spr.getRow(), 0, 3, 8, event.tick);
            if (this.spr.getColumn() == 3) {

                this.speed.x = this.dir*MOVE_SPEED;
                this.target.x = this.speed.x;

                this.speed.y = JUMP_SPEED;

                event.audio.playSample(event.assets.getSample("enemy_jump"), 0.40);
            }
        }
        else {

            if (this.speed.y > 0) {

                this.spr.setFrame(0, this.spr.getRow());
            }
        }

        this.flip = this.dir > 0 ? Flip.Horizontal : Flip.None;

        this.bounceFactor.x = this.hurtTimer > 0 ? 0 : 1;
    }


    protected verticalCollisionEvent(dir : 1 | -1, event : ProgramEvent) : void {
        
        if (dir == 1) {

            this.target.x = 0;
        }
    }


    protected horizontalCollisionEvent(dir : 1 | -1, event : ProgramEvent) : void {

        this.dir = -dir;
        this.speed.x = this.dir*MOVE_SPEED;
        this.target.x = this.speed.x;

        if (this.touchSurface) {

            this.speed.x = 0;
            this.target.x = 0;
        }
    }
}
