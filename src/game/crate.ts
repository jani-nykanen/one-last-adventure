import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Rectangle } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { CollisionObject } from "./collisionobject.js";


export class Crate extends CollisionObject {


    constructor(x : number, y : number) {

        super(x, y, true);

        this.hitbox = new Rectangle(0, 0, 16, 16);
        this.collisionBox = this.hitbox.clone();

        this.friction = new Vector(0, 0.25);
    }


    public draw(canvas : Canvas, bmp : Bitmap) : void {
        
        if (!this.exist || !this.inCamera)
            return;
    
        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y) - 8;

        canvas.drawBitmap(bmp, Flip.None, dx, dy, 0, 0, 16, 16);
    }
}
