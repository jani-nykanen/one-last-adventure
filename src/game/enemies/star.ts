import { ProgramEvent } from "../../core/event.js";
import { Bitmap, Canvas, Flip } from "../../gfx/interface.js";
import { Rectangle } from "../../math/rectangle.js";
import { TILE_WIDTH } from "../tilesize.js";
import { Enemy } from "./enemy.js";


export class Star extends Enemy {


    private distance : number = 0.0;
    private angle : number = 0.0;


    protected init() : void {
        
        this.damage = 3;

        this.maxHealth = 1;

        this.spr.setFrame(0, 14);

        this.hitbox = new Rectangle(0, 0, 8, 8);

        this.friction.zeros();

        this.weight = 0;

        this.dir = ((this.pos.x/TILE_WIDTH) | 0) % 2 == 0 ? -1 : 1;

        this.canBeHurt = false;
        this.canBeMoved = false;
        this.disableCollisions = true;
    }


    protected updateAI(event : ProgramEvent) : void {

        const MAX_DISTANCE : number = 32;
        const DISTANCE_DELTA : number = MAX_DISTANCE/60;
        const ROTATION_SPEED : number = Math.PI*2/120;

        this.spr.animate(this.spr.getRow(), 0, 1, 8, event.tick);

        this.distance = Math.min(MAX_DISTANCE, this.distance + DISTANCE_DELTA*event.tick);

        this.pos.x = this.initialPos.x + this.dir*Math.cos(this.angle)*this.distance;
        this.pos.y = this.initialPos.y + this.dir*Math.sin(this.angle)*this.distance;

        this.angle = (this.angle + ROTATION_SPEED*event.tick) % (Math.PI*2);
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {

        const CHAIN_COUNT : number = 4;

        if (!this.exist || !this.inCamera)
            return;

        const dx = Math.round(this.pos.x) - this.spr.width/2;
        const dy = Math.round(this.pos.y) - this.spr.height/2;

        // Chain
        const distDelta = this.distance/(CHAIN_COUNT);

        let distance : number;
        let chainx : number;
        let chainy : number;

        const c = Math.cos(this.angle);
        const s = Math.sin(this.angle);

        for (let i = 0; i < CHAIN_COUNT; ++ i) {

            distance = distDelta*i;

            chainx = Math.round(this.initialPos.x + this.dir*c*distance);
            chainy = Math.round(this.initialPos.y + this.dir*s*distance);

            canvas.drawBitmap(bmp, Flip.None, chainx - 8, chainy - 8, 32, 224, 16, 16);
        }

        // Body
        this.spr.draw(canvas, bmp, dx, dy, this.flip);
    }
}
