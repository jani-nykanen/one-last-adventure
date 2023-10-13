import { ProgramEvent } from "../core/event.js";
import { Canvas, Flip, TransformTarget } from "../gfx/interface.js";
import { RGBA } from "../math/rgba.js";
import { negMod } from "../math/utility.js";
import { Camera } from "./camera.js";
import { SnowflakeGenerator } from "./snowflakes.js";


export const enum BackgroundType {

    Unknown = 0,
    Void = 1,
    IslandDay = 2,
    Caves = 3,
};



export class Background {


    private type : BackgroundType;
    private snowflakes : SnowflakeGenerator | undefined = undefined;

    private timers : number[];


    constructor(type : BackgroundType, event? : ProgramEvent | undefined) {

        const COUNT = [0, 1, 1];

        this.type = type;

        this.timers = (new Array<number> (COUNT[type])).fill(0);

        if (type == BackgroundType.Void && event !== undefined) {

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


    private drawIslandDay(canvas : Canvas, shiftx : number, shifty : number) : void {

        const CLOUD_Y : number = 88; // TODO: Move higher?
    
        const bmpSky = canvas.getBitmap("sky_day");
        const bmpClouds = canvas.getBitmap("clouds_day");

        // Sky
        canvas.setColor();
        canvas.drawBitmap(bmpSky);
    
        // Water
        const waterY = CLOUD_Y + (bmpClouds?.height ?? 0) + shifty;
        canvas.setColor(109, 109, 182);
        canvas.fillRect(0, waterY, canvas.width, canvas.height - waterY);
        
        const t = negMod(this.timers[0] - shiftx | 0, 128);

        // Clouds
        canvas.setColor();
        for (let i = 0; i < 3; ++ i) {

            canvas.drawBitmap(bmpClouds, Flip.None, i*128 - t, CLOUD_Y + shifty);
        }
    }


    private drawCave(canvas : Canvas, shiftx : number, shifty : number) : void {

        const bmpBackground = canvas.getBitmap("cave_background");

        const w = (canvas.width/32) | 0;
        const h = (canvas.height/32) | 0;

        let sx = shiftx % 32;
        let sy = shifty % 32;

        for (let y = -1; y < h + 2; ++ y) {

            for (let x = -1; x < w + 2; ++ x) {

                canvas.drawBitmap(bmpBackground, Flip.None, x*32 + sx, y*32 + sy);
            }
        }
    }


    public update(camera : Camera | undefined = undefined, event : ProgramEvent) : void {

        const VORTEX_SPEED : number = Math.PI*2 / 600;
        const CLOUD_SPEED : number = 0.5;

        switch (this.type) {

        case BackgroundType.Void:

            if (camera !== undefined) {

                this.snowflakes?.update(camera, event);
            }
            this.timers[0] = (this.timers[0] + VORTEX_SPEED*event.tick) % (Math.PI*2);
            break;

        case BackgroundType.IslandDay:

            this.timers[0] = (this.timers[0] + CLOUD_SPEED*event.tick) % 128;
            break;

        default:
            break;
        }
    }


    public draw(canvas : Canvas, shiftx : number = 0, shifty : number = 0) : void {

        switch (this.type) {

        case BackgroundType.Void:

            this.drawVoid(canvas);
            break;

        case BackgroundType.IslandDay:

            this.drawIslandDay(canvas, shiftx, shifty);
            break;

        case BackgroundType.Caves:

            this.drawCave(canvas, shiftx, shifty);
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
