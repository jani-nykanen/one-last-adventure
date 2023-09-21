import { ProgramEvent } from "../core/event.js";
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


    public collisionObjectCollision(o : CollisionObject, event : ProgramEvent) : void {

        if (!this.isActive() || !o.isActive())
            return;

        // TODO: Maybe check if the collidable object is close enough before
        // making four function calls (that will check the same thing, anyway,
        // though)?

        o.verticalCollision(this.pos.x - 8, this.pos.y - 8, 16, 1, event);
        o.verticalCollision(this.pos.x - 7, this.pos.y + 8, 14, -1, event);
        o.horizontalCollision(this.pos.x - 8, this.pos.y - 8, 16, 1, event);
        o.horizontalCollision(this.pos.x + 8, this.pos.y - 8, 16, -1, event);
    }
}
