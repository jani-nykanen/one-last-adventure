import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Rectangle } from "../../math/rectangle.js";
import { Player } from "../player.js";
import { TILE_WIDTH } from "../tilesize.js";
import { Enemy } from "./enemy.js";



export class Apple extends Enemy {


    
    protected init() : void {
        
        this.damage = 2;

        this.maxHealth = 5;

        this.spr.setFrame(0, 5);

        this.dir = (Math.floor(this.pos.x/TILE_WIDTH)) % 2 == 0 ? 1 : -1;

        this.collisionBox = new Rectangle(0, 2, 10, 12);
        this.hitbox = new Rectangle(0, 2, 12, 12);

        this.target.y = 0;

        this.getGravity = false;

        this.bounceFactor.x = 1;

        this.weight = 1.10;
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const MOVE_SPEED : number = 0.25;
        const WAVE_SPEED : number = Math.PI*2/120.0;

        this.spr.animate(5, 0, 3, 6, event.tick);

        this.flip = this.dir > 0 ? Flip.Horizontal : Flip.None;

        this.specialTimer = (this.specialTimer + WAVE_SPEED*event.tick) % (Math.PI*2);

        this.target.x = this.dir*MOVE_SPEED;

        this.target.y = Math.sin(this.specialTimer)*0.25;
    }


    protected horizontalCollisionEvent(dir : 1 | -1, event : ProgramEvent): void {
        
        this.dir *= -1;
    }
}
