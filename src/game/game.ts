import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Canvas, TransformTarget } from "../gfx/interface.js";


export class Game implements Scene {


    public init(param : SceneParameter, event : ProgramEvent) : void {

        // ...
    }


    public update(event : ProgramEvent) : void {
        
        // ...
    }


    public redraw(canvas : Canvas) : void {
        
        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.view(canvas.width, canvas.height);

        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();

        canvas.applyTransform();

        canvas.clear(170, 170, 170);

        canvas.setColor(255, 0, 0, 1.0);
        canvas.fillRect(0, 0, 32, 32);

        canvas.setColor(255, 170, 0, 1.0);
        canvas.fillRect(16, 16, 32, 32);
    }


    public dispose() : SceneParameter {

        return undefined;
    }

}
