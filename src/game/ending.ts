import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Canvas, Flip, TransformTarget } from "../gfx/interface.js";
import { drawUIBox } from "../ui/box.js";
import { TextBox } from "../ui/textbox.js";
import { Menu } from "../ui/menu.js";
import { MenuButton } from "../ui/menubutton.js";
import { TransitionType } from "../core/transition.js";



export class Ending implements Scene {


    private phase : number = 0;
    private endingMessage : TextBox | undefined = undefined;

    private timer : number = 0;


    public init(param : SceneParameter, event : ProgramEvent): void {
        
        this.endingMessage = new TextBox();

        const text = event.localization?.getItem("ending") ?? [];
        this.endingMessage.addText(text);

        event.transition.changeSpeed(1.0/60.0);

        this.phase = 0;
        this.timer = 0;
    }


    public update(event : ProgramEvent): void {
        
        const RETURN_TIME : number = 300;

        if (event.transition.isActive() || this.endingMessage === undefined)
            return;

        if (this.phase == 0) {

            if (!this.endingMessage.isActive()) {

                this.endingMessage.activate(false, () => {

                    this.phase = 1;
                    event.transition.activate(false, TransitionType.Fade, 1.0/60.0, event);
                })
            }
            else {

                this.endingMessage.update(event);
            }
        }
        else {

           this.timer += event.tick;
           if (this.timer >= RETURN_TIME) {

                event.transition.activate(true, TransitionType.Fade, 1.0/60.0, event,
                (event : ProgramEvent) => {

                    event.scenes.changeScene("titlescreen", event);
                    event.transition.activate(false, TransitionType.Circle, 1.0/30.0, event);
                });
           }
        }
    }


    public redraw(canvas : Canvas): void {
        
        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.view(canvas.width, canvas.height);

        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();
        canvas.applyTransform();

        canvas.setColor();

        const bmpEnd = canvas.getBitmap("the_end");

        if (this.phase == 0) {

            canvas.clear(0, 0, 0);
            this.endingMessage?.draw(canvas, 0, 0, 2, false, true);
        }
        else {

            canvas.clear(255, 255, 255);

            if (bmpEnd !== undefined) {

                canvas.drawBitmap(bmpEnd, Flip.None,
                    canvas.width/2 - bmpEnd.width/2,
                    canvas.height/2 - bmpEnd.height/2);
            }
        }
    }


    public dispose() : SceneParameter {
        
        return undefined;
    }

}
