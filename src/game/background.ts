import { ProgramEvent } from "../core/event.js";
import { Canvas, Flip, TransformTarget } from "../gfx/interface.js";
import { RGBA } from "../math/rgba.js";
import { Camera } from "./camera.js";
import { SnowflakeGenerator } from "./snowflakes.js";


export const enum BackgroundType {

    Unknown = 0,
    Void = 1,
};



export class Background {


    private type : BackgroundType;
    private snowflakes : SnowflakeGenerator | undefined = undefined;

    private timers : number[];


    constructor(type : BackgroundType, event : ProgramEvent) {

        const COUNT = [0, 1];

        this.type = BackgroundType.Void;

        this.timers = (new Array<number> (COUNT[type])).fill(0);

        if (type == BackgroundType.Void) {

            this.snowflakes = new SnowflakeGenerator(event);
        }
    }


    private drawVoid(canvas : Canvas) : void {

        const bmpVortex = canvas.getBitmap("vortex");
        const t = canvas.transform;

        canvas.clear(255, 255, 255);

        t.setTarget(TransformTarget.Model);
        t.push();
        t.translate(canvas.width/2, canvas.height/2);
        t.scale(1, 0.60);
        t.rotate(this.timers[0]);
        canvas.applyTransform();

        canvas.setColor(219, 219, 219);
        canvas.drawBitmap(bmpVortex, Flip.None, -(bmpVortex?.width ?? 0)/2, -(bmpVortex?.height ?? 0)/2);

        t.pop();
        canvas.applyTransform();
        canvas.setColor();
    }


    public update(camera : Camera, event : ProgramEvent) : void {

        const VORTEX_SPEED : number = Math.PI*2 / 600;

        switch (this.type) {

        case BackgroundType.Void:

            this.snowflakes?.update(camera, event);
            this.timers[0] = (this.timers[0] + VORTEX_SPEED*event.tick) % (Math.PI*2);
            break;

        default:
            break;
        }
    }


    public draw(canvas : Canvas) : void {

        switch (this.type) {

        case BackgroundType.Void:

            this.drawVoid(canvas);
            break;
    
        default:
            break;
        }
    }


    public drawForegorund(canvas : Canvas) : void {

        switch (this.type) {

        case BackgroundType.Void:

            this.snowflakes?.draw(canvas, new RGBA(0, 0, 0), 0.50);
            break;
    
        default:
            break;
        }
    }
}
