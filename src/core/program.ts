import { Canvas, Renderer, TransformTarget } from "../gfx/interface.js";
import { ProgramEvent } from "./event.js";


export class Program {


    private renderer : Renderer;
    private event : ProgramEvent;

    private timeSum : number = 0.0;
    private oldTime : number = 0.0;

    private initialized : boolean = false;

    private onloadEvent : ((event : ProgramEvent) => void) | undefined = undefined;


    constructor(canvasWidth : number, canvasHeight : number, type : Function) {

        this.renderer = (new type.prototype.constructor (canvasWidth, canvasHeight)) as Renderer;
        this.event = new ProgramEvent(this.renderer);
    }


    private drawLoadingScreen(canvas : Canvas) : void {

        const OUTLINE = 1;
        const WIDTH = 64;
        const HEIGHT = 12;

        const p = this.event.assets.getLoadingPercentage();

        const dx = canvas.width/2 - WIDTH/2;
        const dy = canvas.height/2 - HEIGHT/2;

        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();

        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.view(canvas.width, canvas.height);

        canvas.applyTransform();

        canvas.clear(0, 85, 170);
        canvas.setColor();
        canvas.fillRect(dx, dy, WIDTH, HEIGHT);
        canvas.setColor(0, 85, 170);
        canvas.fillRect(dx + OUTLINE, dy + OUTLINE, WIDTH - OUTLINE*2, HEIGHT - OUTLINE*2);
        canvas.setColor();
        canvas.fillRect(dx + OUTLINE*2, dy + OUTLINE*2, (WIDTH - OUTLINE*4)*p, HEIGHT - OUTLINE*4);
    }


    private loop(ts : number) : void {

        const MAX_REFRESH_COUNT = 5; // Needed in the case that window gets deactivated and reactivated much later
        const FRAME_TIME = 16.66667;

        const delta = ts - this.oldTime;
        const loaded = this.event.assets.hasLoaded();

        this.timeSum = Math.min(this.timeSum + delta, MAX_REFRESH_COUNT * FRAME_TIME);
        this.oldTime = ts;

        if (loaded && !this.initialized) {

            this.onloadEvent?.(this.event);
            this.event.scenes.init(this.event);

            this.initialized = true;
        }

        let firstFrame = true;
        for (; this.timeSum >= FRAME_TIME; this.timeSum -= FRAME_TIME) {

            this.event.input.updateStick();

            if (loaded) {

                this.event.scenes.update(this.event);
                this.event.transition.update(this.event);
            }
            
            if (firstFrame) {

                this.event.input.update();
                firstFrame = false;
            }
        }
        
        this.renderer.drawToCanvas((canvas : Canvas) : void => {

            if (loaded) {
                
                this.event.scenes.redraw(canvas);
                this.event.transition.draw(canvas);
            }
            else {

                this.drawLoadingScreen(canvas);
            }
        });
        this.renderer.refresh();

        window.requestAnimationFrame(ts => this.loop(ts));
    }


    public run(initialEvent? : (event : ProgramEvent) => void,
        onload? : (event : ProgramEvent) => void) : void {

        initialEvent?.(this.event);
        this.onloadEvent = onload;

        this.loop(0.0);
    }
}
