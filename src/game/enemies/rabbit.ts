import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Player } from "../player.js";
import { Enemy } from "./enemy.js";


const JUMP_TIME : number = 45;


export class Rabbit extends Enemy {


    protected init() : void {
        
        this.damage = 2;

        this.maxHealth = 5;

        this.friction.y = 0.075;

        this.collisionBox.w = 10;

        this.spr.setFrame(1, 2);

        this.specialTimer = (Math.random()*JUMP_TIME) | 0;

        this.weight = 0.95;
    }


    protected playerEvent(player : Player, event : ProgramEvent): void {
        
        this.dir = player.getPosition().x - this.pos.x > 0 ? 1 : -1;

        if (this.touchSurface) {

            this.flip = this.dir > 0 ? Flip.Horizontal : Flip.None;
        }
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const MOVE_SPEED : number = 0.40;
        const JUMP_SPEED : number = -2.0;
        const FRAME_EPS : number = 0.33;

        let frame : number;

        if (this.touchSurface) {

            this.target.x = 0;

            this.spr.setFrame(0, 2);

            this.specialTimer += event.tick;
            if (this.specialTimer >= JUMP_TIME) {

                this.specialTimer = 0;
                this.speed.y = JUMP_SPEED;

                this.target.x = this.dir*MOVE_SPEED;
                this.speed.x = this.target.x;

                event.audio.playSample(event.assets.getSample("enemy_jump"), 0.40);
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
