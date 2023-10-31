import { ProgramEvent } from "../../core/event.js";
import { Bitmap, Canvas, Flip } from "../../gfx/interface.js";
import { Rectangle } from "../../math/rectangle.js";
import { Vector } from "../../math/vector.js";
import { TILE_WIDTH } from "../tilesize.js";
import { Enemy } from "./enemy.js";


export class Hand extends Enemy {


    private posRef : Vector | undefined = undefined;
    private distance : number = 0;


    protected init() : void {
        
        this.damage = 2;

        this.maxHealth = 1;

        this.hitbox = new Rectangle(0, 0, 16, 16);

        this.friction.x = 0;
        this.friction.y = 0.025;

        this.weight = 0;

        this.canBeHurt = false;
        this.canBeMoved = false;
        this.disableCollisions = true;
        this.getGravity = false;

        this.inCamera = true;
    }


    protected updateAI(event : ProgramEvent) : void {

        const TARGET_Y : number = 0.25;

        const ydir = Math.sign((this.posRef?.y ?? 0) - this.pos.y);
        
        this.pos.x = (this.posRef?.x ?? 0) + this.distance*this.dir;

        this.target.y = ydir*TARGET_Y;
    }


    public draw(canvas : Canvas, _? : Bitmap) : void {

        if (!this.exist)
            return;

        const dx = Math.round(this.pos.x) - 16;
        const dy = Math.round(this.pos.y) - 16;

        const bmp = canvas.getBitmap("final_boss");

        canvas.drawBitmap(bmp, this.flip, dx, dy, 64, 0, 32, 32);
    }


    public initialize(posRef : Vector, distance : number, flip : Flip, dir : -1 | 1) : void {

        this.posRef = posRef;
        this.distance = distance;
        this.flip = flip;

        this.dir = dir;
    }
}
