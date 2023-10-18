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

        this.spr.setFrame(0, 8);

        this.collisionBox = new Rectangle(0, 0, 6, 6);
        this.hitbox = new Rectangle(0, 0, 8, 8);

        this.friction.x = 0.0125;
        this.friction.y = 0.0125;

        this.getGravity = false;

        // this.bounceFactor.x = 1;
        // this.bounceFactor.y = 1;

        this.weight = 0.50;
    }


    protected playerEvent(player : Player, event : ProgramEvent) : void {
        
        const RUSH_TIME : number = 300;
        const RUSH_SPEED : number = 4.0;

        if (this.specialTimer <= 0) {
            
            this.speed = Vector.scalarMultiply(
                Vector.direction(this.pos, player.getPosition()), 
                RUSH_SPEED);
            this.specialTimer += RUSH_TIME;
        }
    }


    protected updateAI(event : ProgramEvent) : void {
        
        this.spr.animate(this.spr.getRow(), 0, 3, 3, event.tick);

        this.specialTimer -= event.tick;

        this.flip = Flip.None;
    }


    protected horizontalCollisionEvent(dir : 1 | -1, event : ProgramEvent): void {
        
        if (this.hurtTimer > 0)
            return;

        this.dir = -dir;
    }
}
