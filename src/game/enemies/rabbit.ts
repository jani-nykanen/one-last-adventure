import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Player } from "../player.js";
import { Enemy } from "./enemy.js";


const JUMP_TIME : number = 30;


export class Rabbit extends Enemy {


    protected init() : void {
        
        this.damage = 2;

        this.maxHealth = 5;

        this.friction.y = 0.125;

        this.spr.setFrame(1, 2);

        this.specialTimer = (Math.random()*JUMP_TIME) | 0;
    }


    protected playerEvent(player : Player, event : ProgramEvent): void {
        
        const dir = player.getPosition().x - this.pos.x;

        this.flip = dir > 0 ? Flip.Horizontal : Flip.None;
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const JUMP_SPEED : number = -3.25;
        const FRAME_EPS : number = 0.5;

        let frame : number;

        if (this.touchSurface) {

            this.spr.setFrame(0, 2);

            this.specialTimer += event.tick;

            if (this.specialTimer >= JUMP_TIME) {

                this.specialTimer = 0;
                this.speed.y = JUMP_SPEED;
            }
        }
        else {

            frame = 0;
            if (this.speed.y < -FRAME_EPS)
                frame = 1;
            else if (this.speed.y > FRAME_EPS)
                frame = 2;

            this.spr.setFrame(frame, 2);
        }
    }
}
