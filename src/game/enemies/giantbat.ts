import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Rectangle } from "../../math/rectangle.js";
import { Vector } from "../../math/vector.js";
import { Player } from "../player.js";
import { Enemy } from "./enemy.js";


const CEILING_SHIFT : number = -4;


export class GiantBat extends Enemy {


    protected init() : void {
        
        this.damage = 3;

        this.maxHealth = 9;

        this.spr.setFrame(4, 15);

        this.collisionBox = new Rectangle(0, 0, 8, 8);
        this.hitbox = new Rectangle(0, 0, 12, 12);

        this.getGravity = false;

        this.weight = 0.50;

        this.specialActionActive = false;

        this.pos.y += CEILING_SHIFT;

        this.friction.x = 0.025;
        this.friction.y = 0.025;
    }


    protected playerEvent(player : Player, event : ProgramEvent): void {
        
        const DROP_TIME : number = 45;
        const MOVE_SPEED : number = 0.5;
        const ESCAPE_SPEED : number = -1.0;
        const BASE_FRICTION : number = 0.025;
        const ESCAPE_FRICTION : number = 0.1;

        const ACTIVATION_DISTANCE_X : number = 32;
        const ACTIVATION_DISTANCE_Y : number = 64;

        const p = player.getPosition();

        let moveSpeed : number;
        let friction : number;

        const escaping = player.isAttacking();

        if (this.specialActionActive) {

            moveSpeed = escaping ? ESCAPE_SPEED : MOVE_SPEED;
            friction = escaping ? ESCAPE_FRICTION : BASE_FRICTION;

            this.bounceFactor.x = (escaping && this.hurtTimer <= 0) ? 1 : 0;
            this.bounceFactor.y = this.bounceFactor.x;

            this.target = Vector.scalarMultiply(
                Vector.direction(this.pos, p), 
                moveSpeed);
            return;
        }

        const xdist = Math.abs(this.pos.x - p.x);
        const ydist = Math.abs(this.pos.y - p.y);

        if (p.y > this.pos.y - 16 &&
            xdist <= ACTIVATION_DISTANCE_X &&
            ydist <= ACTIVATION_DISTANCE_Y) {

            this.specialActionActive = true;
            this.specialTimer = DROP_TIME;

            this.pos.y -= CEILING_SHIFT;
        }
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const DROP_GRAVITY : number = 4.0;

        if (this.health < this.maxHealth) {

            this.specialActionActive = true;
        }

        if (!this.specialActionActive) 
            return;

        if (this.specialTimer > 0) {

            this.target.y = DROP_GRAVITY;

            this.spr.setFrame(0, this.spr.getRow());

            this.flip = Flip.Vertical;

            this.specialTimer -= event.tick;
            return;
        }

        this.flip = Flip.None;

        this.spr.animate(this.spr.getRow(), 0, 3, 5, event.tick);
    }

}
