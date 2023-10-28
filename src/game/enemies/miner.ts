import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Player } from "../player.js";
import { Projectile } from "../projectile.js";
import { Enemy } from "./enemy.js";


const THROW_TIME : number = 90;


export class Miner extends Enemy {


    protected init() : void {
        
        this.damage = 1;

        this.maxHealth = 4;

        this.spr.setFrame(0, 6);

        this.specialTimer = THROW_TIME/2 + ((Math.random()*THROW_TIME/2) | 0);

        this.weight = 1.0;

        this.dropProbability = 0.25;
    }


    protected playerEvent(player : Player, event : ProgramEvent): void {
        
        this.dir = player.getPosition().x - this.pos.x > 0 ? 1 : -1;

        if (this.touchSurface && !this.specialActionActive) {

            this.flip = this.dir < 0 ? Flip.Horizontal : Flip.None;
        }
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const THROW_SPEED : number = 2.5;

        let p : Projectile;

        if (!this.specialActionActive) {

            this.specialTimer -= event.tick;
            if (this.specialTimer <= 0.0) {

                this.specialActionActive = true;
                this.spr.setFrame(1, this.spr.getRow());

                event.audio.playSample(event.assets.getSample("throw"), 0.60);

                p = this.projectiles.spawn(this.pos.x + this.dir*4, this.pos.y + 1, this.dir*THROW_SPEED, 0.0, 1, 2, false);
                p.setOldPos(this.pos.x, this.pos.y + 1);
            }
        }
        else {

            this.spr.animate(this.spr.getRow(), 1, 4, this.spr.getColumn() == 3 ? 30 : 5, event.tick);
            if (this.spr.getColumn() == 4) {

                this.spr.setFrame(0, this.spr.getRow());

                this.specialTimer = THROW_TIME;
                this.specialActionActive = false;
            }
        }
    }
}
