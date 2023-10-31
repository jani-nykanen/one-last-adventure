import { ProgramEvent } from "../core/event";
import { Canvas, TransformTarget } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject";


export class Camera {


    private pos : Vector;
    private target : Vector;
    private interpolatedPos : Vector;

    private moving : boolean = false;
    private moveSpeed : number = 1.0;
    private moveTimer : number = 0.0;

    private stoppedMoving : boolean = false;

    private shakeAmount : number = 0;
    private shakeTimer : number = 0;

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

        this.stoppedMoving = false;

        if (!this.moving) {

            if (this.shakeTimer > 0) {

                this.shakeTimer -= event.tick;
            }

            return;
        }
        this.shakeTimer = 0;

        if ((this.moveTimer -= this.moveSpeed*event.tick) <= 0) {

            this.pos = this.target.clone();

            this.moving = false;
            this.interpolatedPos = new Vector(
                (this.target.x*this.width) | 0, 
                (this.target.y*this.height) | 0);

            this.stoppedMoving = true;

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

        let shiftx = 0;
        let shifty = 0;

        if (this.shakeTimer > 0) {

            shiftx = Math.round((-1 + Math.random()*2)*this.shakeAmount);
            shifty = Math.round((-1 + Math.random()*2)*this.shakeAmount);
        }

        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.translate(
            -Math.round(this.interpolatedPos.x) + shiftx, 
            -Math.round(this.interpolatedPos.y) + shifty);
        canvas.applyTransform();
    }


    public getTopCorner = () : Vector => this.interpolatedPos.clone();
    public getTarget = () : Vector => this.target.clone();


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


    public center(o : GameObject) : void {

        const pos = o.getPosition();

        const x = (pos.x/this.width) | 0;
        const y = (pos.y/this.height) | 0;
    
        this.pos.x = x;
        this.pos.y = y;

        this.target = this.pos.clone();
        this.interpolatedPos = new Vector(x*this.width, y*this.height);

        this.moveTimer = 0;
        this.moving = false;
    }


    public didStopMoving = () : boolean => this.stoppedMoving; 


    public shake(amount : number, time : number) : void {

        this.shakeAmount = amount;
        this.shakeTimer = time;
    }


    public forceShift(x : number, y : number) : void {

        this.pos.x = x;
        this.pos.y = y;

        this.target = this.pos.clone();

        this.moving = false;

        this.interpolatedPos = new Vector(
            (this.target.x*this.width) | 0, 
            (this.target.y*this.height) | 0);
    }
}
