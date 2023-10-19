import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Rectangle } from "../../math/rectangle.js";
import { Vector } from "../../math/vector.js";
import { Player } from "../player.js";
import { Enemy } from "./enemy.js";


export class Brick extends Enemy {


    private attackPhase : number = 0;


    protected init() : void {
        
        this.damage = 2;

        this.maxHealth = 4;

        this.spr.setFrame(0, 10);

        this.collisionBox = new Rectangle(0, 1, 16, 14);
        this.hitbox = new Rectangle(0, 0, 12, 12);

        this.friction.y = 0.5;

        this.weight = 0;
    }


    protected playerEvent(player : Player, event : ProgramEvent) : void {

        const DROP_SPEED : number = 4.0;
        const X_DIST : number = 32;

        if (this.attackPhase != 0)
            return;

        const p = player.getPosition();
        if (Math.abs(p.x - this.pos.x) < X_DIST && p.y <= this.pos.y - 8) {
            
            this.attackPhase = 1;
            this.target.y = DROP_SPEED;
        }
    }


    protected updateAI(event : ProgramEvent) : void {

        const WAIT_TIME : number = 60;
        const RETURN_SPEED : number = -0.5;
        const FRAME : number[] = [0, 1, 1, 2];

        this.spr.setFrame(FRAME[this.attackPhase], this.spr.getRow());

        // TODO: Use switch
        if (this.attackPhase == 0) {

            this.speed.zeros();
            this.target.zeros();
        }
        else if (this.attackPhase == 2) {

            this.specialTimer += event.tick;
            if (this.specialTimer >= WAIT_TIME) {

                this.specialTimer = 0;
                this.attackPhase = 3;
            }
        }
        else if (this.attackPhase == 3) {

            this.speed.y = RETURN_SPEED;
            if (this.pos.y <= this.initialPos.y) {

                this.pos = this.initialPos.clone();
            }
        }

        this.damage = this.attackPhase == 1 ? 5 : 2;
    }


    protected verticalCollisionEvent(dir: 1 | -1, event: ProgramEvent): void {
        
        if (this.attackPhase == 1 && dir == 1) {

            this.attackPhase = 2;
            this.specialTimer = 0;
        }
    }
}
