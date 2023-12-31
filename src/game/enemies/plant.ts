import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Player } from "../player.js";
import { Projectile } from "../projectile.js";
import { Enemy } from "./enemy.js";


const SHOOT_TIME : number = 90;


export class Plant extends Enemy {


    protected init() : void {
        
        this.damage = 1;

        this.maxHealth = 4;

        this.friction.y = 0.1;

        this.spr.setFrame(0, 12);

        this.specialTimer = SHOOT_TIME/2 + ((Math.random()*SHOOT_TIME/2) | 0);

        this.weight = 0.25;
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const SHOOT_SPEED_X : number = 0.75;
        const SHOOT_SPEED_Y : number = -2.5;

        let p : Projectile;

        if (!this.specialActionActive) {

            this.specialTimer -= event.tick;
            if (this.specialTimer <= 0.0) {

                this.specialActionActive = true;
                this.spr.setFrame(1, this.spr.getRow());

                event.audio.playSample(event.assets.getSample("throw"), 0.60);

                for (let i = 0; i < 2; ++ i) {

                    p = this.projectiles.spawn(this.pos.x, this.pos.y - 4, (-1 + 2*i)*SHOOT_SPEED_X , SHOOT_SPEED_Y, 2, 2, false, true);
                    p.setOldPos(this.pos.x, this.pos.y + 1);
                }
                
            }
        }
        else {
            
            this.spr.animate(this.spr.getRow(), 1, 6, this.spr.getColumn() == 3 ? 30 : 5, event.tick);
            if (this.spr.getColumn() == 6) {

                this.spr.setFrame(0, this.spr.getRow());

                this.specialTimer = SHOOT_TIME;
                this.specialActionActive = false;
            }
        }
    }
}
