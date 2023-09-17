import { ProgramEvent } from "../core/event";
import { Canvas, TransformTarget } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";


export class Camera {


    private pos : Vector;
    private target : Vector;
    private interpolatedPos : Vector;

    private moving : boolean = false;

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

        // ...
    }


    public move(dx : number, dy : number) : void {

        // ...
    }


    public use(canvas : Canvas) : void {

        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.translate(
            -Math.round(this.interpolatedPos.x*this.width), 
            -Math.round(this.interpolatedPos.y*this.height));
        canvas.applyTransform();
    }


    public getTopCorner = () : Vector => this.interpolatedPos.clone();
}
