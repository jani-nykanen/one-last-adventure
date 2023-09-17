import { ProgramEvent } from "../core/event.js";
import { Rectangle } from "../math/rectangle.js";
import { GameObject } from "./gameobject.js";



export class CollisionObject extends GameObject {


    protected collisionBox : Rectangle;
    protected touchSurface : boolean = false;


    constructor(x : number = 0, y : number = 0, exist : boolean = true) {

        super(x, y, exist);

        this.collisionBox = new Rectangle();
    }


    public updateCollisionFlags() : void {

        this.touchSurface = false;
    }


    public verticalCollision(x : number, y : number, w : number, dir : -1 | 1, event : ProgramEvent) : boolean {

        const NEAR_MARGIN = 2;
        const FAR_MARGIN = 8;

        if (!this.exist || this.dying || 
            this.speed.y*dir < 0 || 
            this.pos.x + this.collisionBox.x + this.collisionBox.w/2 < x ||
            this.pos.x + this.collisionBox.x - this.collisionBox.w/2 > x + w)
            return false;

        const border = this.pos.y + this.collisionBox.y + this.collisionBox.h/2*dir;

        if (border*dir >= (y - NEAR_MARGIN)*dir && 
            border*dir < (y + FAR_MARGIN + Math.abs(this.speed.y)*event.tick)*dir) {

            this.pos.y = y - this.collisionBox.y - this.collisionBox.h/2*dir;
            this.speed.y = 0;

            this.touchSurface ||= dir == 1;

            return true;
        }
        return false;
    }


    public horizontalCollision(x : number, y : number, h : number, dir : -1 | 1, event : ProgramEvent) : boolean {

        // TODO: With some smart code, one could, perhaps, merge
        // this and the function above to one function to rule them all.
        // Good thing I don't write smart code.

        const NEAR_MARGIN = 1;
        const FAR_MARGIN = 8;

        if (!this.exist || this.dying || 
            this.speed.x*dir < 0 || 
            this.pos.y + this.collisionBox.y + this.collisionBox.h/2 < y ||
            this.pos.y + this.collisionBox.y - this.collisionBox.h/2 > y + h)
            return false;

        const border = this.pos.x + this.collisionBox.x + this.collisionBox.w/2*dir;

        // TODO: Replace one of the borders with "old pos border" to properly support
        // projectiles

        if (border*dir >= (x - NEAR_MARGIN*dir)*dir && 
            border*dir < (x + FAR_MARGIN*dir + Math.abs(this.speed.x)*event.tick)*dir) {

            this.pos.x = x - this.collisionBox.x - this.collisionBox.w/2*dir;
            this.speed.x = 0;

            return true;
        }
        return false;
    }
}
