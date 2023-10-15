import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Player } from "../player.js";
import { TILE_WIDTH } from "../tilesize.js";
import { Enemy } from "./enemy.js";



export class Caterpillar extends Enemy {


    protected init() : void {
        
        this.damage = 1;

        this.maxHealth = 2;

        this.spr.setFrame(0, 3);

        this.dir = (Math.floor(this.pos.x/TILE_WIDTH)) % 2 == 0 ? 1 : -1;
        this.collisionBox.w = 8;
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const MOVE_SPEED : number = 0.5;

        const WAIT_SPEED : number = 30;
        const ANIM_SPEED : number = 8;

        const evenFrame = this.spr.getColumn() % 2 == 0;

        this.spr.animate(3, 0, 3, evenFrame ? WAIT_SPEED : ANIM_SPEED, event.tick);

        this.target.x = evenFrame ? 0 : this.dir*MOVE_SPEED*event.tick;

        this.flip = this.dir > 0 ? Flip.Horizontal : Flip.None;
    }


    protected horizontalCollisionEvent(dir: 1 | -1, event : ProgramEvent): void {
        
        this.dir = -dir;
    }
}
