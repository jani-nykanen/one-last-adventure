import { ProgramEvent } from "../core/event.js";
import { Rectangle } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject.js";



export class CollisionObject extends GameObject {


    protected collisionBox : Rectangle;
    protected touchSurface : boolean = false;

    protected bounceFactor : Vector;


    constructor(x : number = 0, y : number = 0, exist : boolean = true) {

        super(x, y, exist);

        this.collisionBox = new Rectangle();
        this.bounceFactor = new Vector(0, 0);
    }


    public updateCollisionFlags() : void {

        this.touchSurface = false;
    }


    protected verticalCollisionEvent?(dir : -1 | 1, event : ProgramEvent) : void;
    protected horizontalCollisionEvent?(dir : -1 | 1, event : ProgramEvent) : void;

    public ladderCollision?(x : number, y : number, w : number, h : number, 
        ladderTop : boolean, event : ProgramEvent) : boolean;

    public hurtCollision?(x : number, y : number, w : number, h : number, damage : number, event : ProgramEvent) : boolean;

    public collisionObjectCollision?(o : CollisionObject, event : ProgramEvent) : void;


    public verticalCollision(x : number, y : number, w : number, dir : -1 | 1, event : ProgramEvent) : boolean {

        const NEAR_MARGIN = 2;
        const FAR_MARGIN = 4;

        if (!this.exist || this.dying || 
            this.speed.y*dir <= 0 || 
            this.pos.x + this.collisionBox.x + this.collisionBox.w/2 < x ||
            this.pos.x + this.collisionBox.x - this.collisionBox.w/2 > x + w)
            return false;


        const oldEdge = this.oldPos.y + this.collisionBox.y + this.collisionBox.h/2*dir;
        const edge = this.pos.y + this.collisionBox.y + this.collisionBox.h/2*dir;

        if ((dir == 1 &&
            oldEdge < y + (FAR_MARGIN + this.speed.y)*event.tick &&
            edge >= y - NEAR_MARGIN*event.tick) ||
            (dir == -1 &&
            oldEdge > y - (FAR_MARGIN + Math.abs(this.speed.y))*event.tick &&
            edge <= y + NEAR_MARGIN*event.tick)){

            this.pos.y = y - this.collisionBox.y - this.collisionBox.h/2*dir;
            this.speed.y *= -this.bounceFactor.y;

            this.touchSurface ||= dir == 1;

            this.verticalCollisionEvent?.(dir, event);

            return true;
        }

        /*    
        const border = this.pos.y + this.collisionBox.y + this.collisionBox.h/2*dir;
        if (border*dir >= (y - dir*NEAR_MARGIN)*dir && 
            border*dir < (y + dir*FAR_MARGIN + Math.abs(this.speed.y)*event.tick)*dir) {

            this.pos.y = y - this.collisionBox.y - this.collisionBox.h/2*dir;
            this.speed.y *= -this.bounceFactor.y;

            this.touchSurface ||= dir == 1;

            this.verticalCollisionEvent?.(dir, event);

            return true;
        }
        */
        return false;
    }


    public horizontalCollision(x : number, y : number, h : number, dir : -1 | 1, event : ProgramEvent) : boolean {

        // TODO: With some smart code, one could, perhaps, merge
        // this and the function above to one function to rule them all.
        // Good thing I don't write smart code.

        const NEAR_MARGIN = 1;
        const FAR_MARGIN = 4;

        const TINY_OFFSET = 1;

        if (!this.exist || this.dying || 
            this.speed.x*dir < 0 || 
            this.pos.y + this.collisionBox.y + this.collisionBox.h/2 < y + TINY_OFFSET ||
            this.pos.y + this.collisionBox.y - this.collisionBox.h/2 > y + h - TINY_OFFSET)
            return false;

        // 

        const oldEdge = this.oldPos.x + this.collisionBox.x + this.collisionBox.w/2*dir;
        const edge = this.pos.x + this.collisionBox.x + this.collisionBox.w/2*dir;

        if ((dir == 1 &&
            oldEdge < x + (FAR_MARGIN + this.speed.x)*event.tick &&
            edge >= x - NEAR_MARGIN*event.tick) ||
            (dir == -1 &&
            oldEdge > x - (FAR_MARGIN + Math.abs(this.speed.x))*event.tick &&
            edge <= x + NEAR_MARGIN*event.tick)){

            this.pos.x = x - this.collisionBox.x - this.collisionBox.w/2*dir;
            this.speed.x *= -this.bounceFactor.x;

            this.horizontalCollisionEvent?.(dir, event);

            return true;
        }

/*  // This did not work
        
        if (border*dir >= (x - NEAR_MARGIN*dir)*dir && 
            border*dir < (x + FAR_MARGIN*dir + Math.abs(this.speed.x)*event.tick)*dir) {

            this.pos.x = x - this.collisionBox.x - this.collisionBox.w/2*dir;
            this.speed.x *= -this.bounceFactor.x;

            this.horizontalCollisionEvent?.(dir, event);

            return true;
        }
        */
        return false;
    }


    public doesTouchSurface = () : boolean => this.touchSurface;



    public isClimbing?() : boolean;
}
