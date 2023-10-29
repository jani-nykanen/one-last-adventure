import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Rectangle } from "../../math/rectangle.js";
import { Vector } from "../../math/vector.js";
import { Player } from "../player.js";
import { Enemy } from "./enemy.js";


export class Flame extends Enemy {

    
    protected init() : void {
        
        this.damage = 3;

        this.maxHealth = 10;

        this.spr.setFrame(0, 17);

        // this.collisionBox = new Rectangle(0, 0, 6, 6);
        this.hitbox = new Rectangle(0, 0, 10, 10);

        this.friction.x = 0.025;
        this.friction.y = 0.025;

        this.getGravity = false;

        this.weight = 0.50;

        this.checkVerticalCameraCollision = true;
        this.disableCollisions = true;

        this.specialTimer = Math.random()*Math.PI*2;

        this.dropProbability = 0;
    }


    protected playerEvent(player : Player, event : ProgramEvent) : void {
        
        const SPEED_TARGET : number = 1.5;

        this.target = Vector.scalarMultiply(
            Vector.direction(this.pos, player.getPosition()), 
            (1.0 + Math.sin(this.specialTimer))/2.0*SPEED_TARGET);
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const SPECIAL_TIMER_SPEED : number = Math.PI*2 / 120;

        this.spr.animate(this.spr.getRow(), 0, 3, 6, event.tick);

        this.specialTimer = (this.specialTimer + SPECIAL_TIMER_SPEED*event.tick) % (Math.PI*2);

        this.flip = Flip.None;
    }
}
