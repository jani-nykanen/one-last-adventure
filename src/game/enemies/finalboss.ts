import { ProgramEvent } from "../../core/event.js";
import { Bitmap, Canvas, Flip } from "../../gfx/interface.js";
import { Rectangle } from "../../math/rectangle.js";
import { Player } from "../player.js";
import { Enemy } from "./enemy.js";



export class FinalBoss extends Enemy {


    protected init() : void {
        
        this.damage = 2;

        this.maxHealth = 128;

        this.dropProbability = 0.0;

        this.collisionBox = new Rectangle(0, 0, 32, 32);
        this.hitbox = new Rectangle(0, 0, 40, 32);

        this.getGravity = false;

        this.weight = 0.50;
    }


    protected playerEvent(player : Player, event : ProgramEvent): void {
        
        // ...
    }


    protected updateAI(event : ProgramEvent) : void {
        
        // ...
    }


    public draw(canvas : Canvas, _?: Bitmap): void {
        
        if (!this.exist)
            return;

        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer/4) % 2 == 0)
            return;

        const bmp = canvas.getBitmap("final_boss");

        const dx = Math.round(this.pos.x) - 32;
        const dy = Math.round(this.pos.y) - 32;

        // Body
        canvas.drawBitmap(bmp, Flip.None, dx, dy, 0, 0, 64, 64);

        // Hands (temporarily here?)
        canvas.drawBitmap(bmp, Flip.None, dx - 36, dy + 16, 64, 0, 32, 32);
        canvas.drawBitmap(bmp, Flip.Horizontal, dx + 68, dy + 16, 64, 0, 32, 32);
    }
}
