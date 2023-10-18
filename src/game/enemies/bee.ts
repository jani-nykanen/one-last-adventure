import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Rectangle } from "../../math/rectangle.js";
import { Vector } from "../../math/vector.js";
import { Player } from "../player.js";
import { Enemy } from "./enemy.js";


const RUSH_TIME : number = 150;


export class Bee extends Enemy {

    
    protected init() : void {
        
        this.damage = 2;

        this.maxHealth = 4;

        this.spr.setFrame(0, 9);

        this.collisionBox = new Rectangle(0, 0, 6, 6);
        this.hitbox = new Rectangle(0, 0, 8, 8);

        this.friction.x = 0.010;
        this.friction.y = 0.010;

        this.getGravity = false;

        // this.bounceFactor.x = 1;
        // this.bounceFactor.y = 1;

        this.weight = 0.50;

        this.checkVerticalCameraCollision = true;

        this.specialTimer = RUSH_TIME/2 + Math.random()*RUSH_TIME/2;
    }


    protected playerEvent(player : Player, event : ProgramEvent) : void {
        
        const RUSH_SPEED : number = 1.5;
        const OFFSET_RADIUS : number = 16;

        let offsetAngle : number;
        let xoff : number;
        let yoff : number;
        let target : Vector;

        if (this.specialTimer <= 0) {
            
            offsetAngle = Math.random()*Math.PI*2;
            xoff = Math.cos(offsetAngle)*OFFSET_RADIUS;
            yoff = Math.sin(offsetAngle)*OFFSET_RADIUS;

            target = player.getPosition();
            target.x += xoff;
            target.y += yoff;

            this.speed = Vector.scalarMultiply(
                Vector.direction(this.pos, target), 
                RUSH_SPEED);
            this.specialTimer += RUSH_TIME;
        }
    }


    protected updateAI(event : ProgramEvent) : void {
        
        this.spr.animate(this.spr.getRow(), 0, 3, 3, event.tick);

        this.specialTimer -= event.tick;

        this.flip = Flip.None;

        const bounce = this.hurtTimer > 0 ? 0 : 1;

        this.bounceFactor.x = bounce;
        this.bounceFactor.y = bounce;
    }


    protected horizontalCollisionEvent(dir : 1 | -1, event : ProgramEvent): void {
        
        if (this.hurtTimer > 0)
            return;

        this.dir = -dir;
    }
}
