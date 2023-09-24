import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Player } from "../player.js";
import { Enemy } from "./enemy.js";



export class Slime extends Enemy {


    protected init() : void {
        
        this.damage = 1;

        this.maxHealth = 5;

        this.spr.setFrame(0, 1);
    }


    protected playerEvent(player : Player, event : ProgramEvent): void {
        
        const dir = player.getPosition().x - this.pos.x;

        this.flip = dir > 0 ? Flip.Horizontal : Flip.None;
    }


    protected updateAI(event : ProgramEvent) : void {
        
        this.spr.animate(1, 0, 3, 8, event.tick);
    }
}
