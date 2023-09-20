import { ProgramEvent } from "../core/event";
import { Canvas, TransformTarget } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";


export class Camera {


    private pos : Vector;
    private target : Vector;
    private interpolatedPos : Vector;

    private moving : boolean = false;
    private moveSpeed : number = 1.0;
    private moveTimer : number = 0.0;

    public readonly width : number;
    public readonly height : number;


    constructor(width : number, height : number,
        x : number = 0, y : number = 0) {

        this.pos = new Vector(x, y);
        this.target = this.pos.clone();

        this.interpolatedPos = new Vector(x*width, y*height);

        this.width = width;
        this.height = height;
    }


    public update(event : ProgramEvent) : void {

        if (!this.moving)
            return;

        if ((this.moveTimer -= this.moveSpeed*event.tick) <= 0) {

            this.pos = this.target.clone();

            this.moving = false;
            this.interpolatedPos = new Vector(
                (this.target.x*this.width) | 0, 
                (this.target.y*this.height) | 0);

            return;
        }

        // TODO: Sine interpolation or something similar for extra smoothness?

        const t = this.moveTimer;

        this.interpolatedPos.x = (t*this.pos.x + (1.0 - t)*this.target.x)*this.width;
        this.interpolatedPos.y = (t*this.pos.y + (1.0 - t)*this.target.y)*this.height;
    }


    public move(dx : number, dy : number, moveSpeed : number) : boolean {

        if (this.moving)
            return false;

        const tx = this.pos.x + dx;
        const ty = this.pos.y + dy;

        if (tx < 0 || ty < 0)
            return false;

        this.target.x = tx;
        this.target.y = ty;

        this.moveSpeed = moveSpeed;
        this.moveTimer = 1.0;

        this.moving = true;

        return true;
    }


    public use(canvas : Canvas) : void {

        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.translate(
            -Math.round(this.interpolatedPos.x), 
            -Math.round(this.interpolatedPos.y));
        canvas.applyTransform();
    }


    public getTopCorner = () : Vector => this.interpolatedPos.clone();


    public isMoving = () : boolean => this.moving;


    public moveDirection = () : Vector => Vector.direction(this.pos, this.target);


    public moveDelta = () : Vector => new Vector(
        (this.target.x - this.pos.x)*this.width*this.moveSpeed,
        (this.target.y - this.pos.y)*this.height*this.moveSpeed);


    public isObjectInCamera(pos : Vector, size : Vector) : boolean {

        return pos.x + size.x/2 >= this.interpolatedPos.x &&
               pos.x - size.x/2 <= this.interpolatedPos.x + this.width &&
               pos.y + size.y/2 >= this.interpolatedPos.y &&
               pos.y - size.y/2 <= this.interpolatedPos.y + this.height;
    }
}
