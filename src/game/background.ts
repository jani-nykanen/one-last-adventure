import { ProgramEvent } from "../core/event.js";
import { Bitmap, Canvas, Flip, TransformTarget } from "../gfx/interface.js";
import { RGBA } from "../math/rgba.js";
import { negMod } from "../math/utility.js";
import { Camera } from "./camera.js";
import { SnowflakeGenerator } from "./snowflakes.js";


export const enum BackgroundType {

    Unknown = 0,
    Void = 1,
    IslandDay = 2,
    Caves = 3,
    Castle = 4,
    FinalBoss = 5,
};


export class Background {


    private originalType : BackgroundType;

    private type : BackgroundType;
    private snowflakes : SnowflakeGenerator | undefined = undefined;

    private timers : number[];


    constructor(type : BackgroundType, event? : ProgramEvent) {

        const COUNT = [0, 1, 1];

        this.type = type;
        this.originalType = type;

        this.timers = (new Array<number> (COUNT[type])).fill(0);

        if (event !== undefined && 
            (type == BackgroundType.Void ||
            type == BackgroundType.Castle)) {

            this.snowflakes = new SnowflakeGenerator(event);
        }
    }


    private drawVortex(canvas : Canvas) : void {

        const bmpVortex = canvas.getBitmap("vortex");
        const t = canvas.transform;

        t.setTarget(TransformTarget.Model);
        t.push();
        t.translate(canvas.width/2, canvas.height/2);
        t.scale(1, 0.60);
        t.rotate(this.timers[0]);
        canvas.applyTransform();
        
        canvas.drawBitmap(bmpVortex, Flip.None, -(bmpVortex?.width ?? 0)/2, -(bmpVortex?.height ?? 0)/2);

        t.pop();
        canvas.applyTransform();
        canvas.setColor();
    }


    private drawVoid(canvas : Canvas) : void {

        canvas.clear(255, 255, 255);

        canvas.setColor(219, 219, 219);
        this.drawVortex(canvas);
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


    private drawRepeatingBackground(canvas : Canvas, bmp : Bitmap | undefined,
        shiftx : number, shifty : number) : void {

        const bw = bmp?.width ?? 32;
        const bh = bmp?.height ?? 32;

        const w = (canvas.width/bw) | 0;
        const h = (canvas.height/bh) | 0;

        let sx = shiftx % bw;
        let sy = shifty % bh;
            
        for (let y = -1; y < h + 2; ++ y) {

            for (let x = -1; x < w + 2; ++ x) {

                canvas.drawBitmap(bmp, Flip.None, x*bw + sx, y*bh + sy);
            }
        }
    }


    private drawFinalBossBackground(canvas : Canvas) : void {

        canvas.clear(73, 0, 73);

        canvas.setColor(109, 36, 109);
        this.drawVortex(canvas);
    }


    public update(camera : Camera | undefined = undefined, event : ProgramEvent) : void {

        const VORTEX_SPEED : number = Math.PI*2/600;
        const FINAL_VORTEX_SPEED : number = Math.PI*2/300;
        const CLOUD_SPEED : number = 0.5;

        if (camera !== undefined) {
            
            this.snowflakes?.update(camera, event);
        }

        switch (this.type) {

        case BackgroundType.Void:

            this.timers[0] = (this.timers[0] + VORTEX_SPEED*event.tick) % (Math.PI*2);
            break;

        case BackgroundType.IslandDay:

            this.timers[0] = (this.timers[0] + CLOUD_SPEED*event.tick) % 128;
            break;

        case BackgroundType.FinalBoss:

            this.timers[0] = (this.timers[0] + FINAL_VORTEX_SPEED*event.tick) % (Math.PI*2);
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

            this.drawRepeatingBackground(canvas, canvas.getBitmap("cave_background"), shiftx, shifty);
            break;
    
        case BackgroundType.Castle:

            this.drawRepeatingBackground(canvas, canvas.getBitmap("castle_background"), shiftx, shifty);
            break;

        case BackgroundType.FinalBoss:

            this.drawFinalBossBackground(canvas);
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

        case BackgroundType.Castle:

            this.snowflakes?.draw(canvas, new RGBA(255, 255, 255), 0.50);
            break;    
    
        default:
            break;
        }
    }


    public changeType(newType : BackgroundType) : void {
        
        this.type = newType;

        this.timers[0] = 0;
    }


    public restore() : void {

        this.type = this.originalType;
    }
}
