import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Canvas, Flip, TransformTarget } from "../gfx/interface.js";
import { TransitionType } from "../core/transition.js";


export class Intro implements Scene {


    private phase : number = 0;
    private timer : number = 0;


    public init(param : SceneParameter, event : ProgramEvent) : void {
        
        event.transition.activate(false, TransitionType.Fade, 1.0/30.0, event);
    }


    public update(event : ProgramEvent): void {
        
        const PHASE_TIME : number = 90;

        if (event.transition.isActive())
            return;

        this.timer += event.tick;
        if (this.timer >= PHASE_TIME || event.input.isAnyPressed()) {

            event.transition.activate(true, TransitionType.Fade, 1.0/30.0, event,
                (event : ProgramEvent) => {

                    if (this.phase == 0) {

                        ++ this.phase;
                        this.timer = 0;
                    }
                    else {

                        event.scenes.changeScene("titlescreen", event);
                        event.transition.activate(false, TransitionType.Circle, 1.0/60.0, event);
                    }
                });
        }
    }


    public redraw(canvas : Canvas): void {
        
        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.view(canvas.width, canvas.height);

        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();
        canvas.applyTransform();

        canvas.setColor();

        canvas.clear(0, 0, 0);

        const bmp = canvas.getBitmap("created_by");

        if (bmp === undefined)
            return;

        canvas.drawBitmap(bmp, Flip.None, 
            canvas.width/2 - bmp.width/2, canvas.height/2 - bmp.height/4,
            0, this.phase*48, 128, 48);
    }


    public dispose() : SceneParameter {
        
        return undefined;
    }

}
