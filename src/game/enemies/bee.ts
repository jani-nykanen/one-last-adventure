import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Rectangle } from "../../math/rectangle.js";
import { Vector } from "../../math/vector.js";
import { Player } from "../player.js";
import { Enemy } from "./enemy.js";



export class Bee extends Enemy {

    
    protected init() : void {
        
        this.damage = 2;

        this.maxHealth = 4;

        this.spr.setFrame(0, 9);

        this.collisionBox = new Rectangle(0, 0, 6, 6);
        this.hitbox = new Rectangle(0, 0, 8, 8);

        this.friction.x = 0.025;
        this.friction.y = 0.025;

        this.getGravity = false;

        this.weight = 0.50;

        this.checkVerticalCameraCollision = true;
        this.disableCollisions = true;

        this.specialTimer = Math.random()*Math.PI*2;
    }


    protected playerEvent(player : Player, event : ProgramEvent) : void {
        
        const MOVE_TARGET : number = 1.0;
        const OFFSET_RADIUS : number = 32;

        const xoff = Math.cos(this.specialTimer)*OFFSET_RADIUS;
        const yoff = Math.sin(this.specialTimer)*OFFSET_RADIUS;

        const target = player.getPosition();
        target.x += xoff;
        target.y += yoff;

        this.target = Vector.scalarMultiply(
            Vector.direction(this.pos, target), 
            MOVE_TARGET);
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const CIRCULATION_SPEED : number = Math.PI*2 / 240;

        this.spr.animate(this.spr.getRow(), 0, 3, 3, event.tick);

        this.specialTimer = (this.specialTimer + CIRCULATION_SPEED*event.tick) % (Math.PI*2);

        this.flip = Flip.None;
    }
}
