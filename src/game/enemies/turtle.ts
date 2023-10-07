import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Player } from "../player.js";
import { TILE_WIDTH } from "../tilesize.js";
import { Enemy } from "./enemy.js";



export class Turtle extends Enemy {


    protected init() : void {
        
        this.damage = 2;

        this.maxHealth = 6;

        this.spr.setFrame(0, 4);

        this.dir = (Math.floor(this.pos.x/TILE_WIDTH)) % 2 == 0 ? 1 : -1;

        this.collisionBox.w = 8;
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const MOVE_SPEED : number = 0.25;

        this.spr.animate(4, 0, 3, 8, event.tick);

        if (this.didTouchSurface && !this.touchSurface && this.hurtTimer <= 0) {

            this.dir *= -1;
            this.pos.x += MOVE_SPEED*this.dir*event.tick;

            this.speed.x = this.dir*MOVE_SPEED;
        }
        this.target.x = this.dir*MOVE_SPEED*event.tick;

        this.flip = this.dir > 0 ? Flip.Horizontal : Flip.None;
    }


    protected horizontalCollisionEvent(dir: 1 | -1, event : ProgramEvent): void {
        
        this.dir *= -1;
    }
}
