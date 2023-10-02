import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Canvas, TransformTarget } from "../gfx/interface.js";
import { ConfirmationBox } from "../ui/confirmationbox.js";


const INFO_TEXT = 
`Would you like to
enable audio? You can
change this later in
the settings.

Press ENTER to confirm.`;


export class AudioIntro implements Scene {


    private yesNoMenu : ConfirmationBox;

    private textWidth : number;
    private textHeight : number;


    public init(param : SceneParameter, event : ProgramEvent): void {
        
        const strYes = event.localization?.getItem("yes")?.[0] ?? "null";
        const strNo = event.localization?.getItem("no")?.[0] ?? "null";

        this.yesNoMenu = new ConfirmationBox(
            [strYes, strNo], "",
            (event : ProgramEvent) => {

                this.goToNextScene(true, event);
            },
            (event : ProgramEvent) => {

                this.goToNextScene(false, event);
            });

        this.yesNoMenu.activate(0);

        const lines = INFO_TEXT.split("\n");
        this.textWidth = Math.max(...lines.map(s => s.length));
        this.textHeight = lines.length;
    }


    private goToNextScene(toggleAudio : boolean, event : ProgramEvent) : void {

        event.audio.toggle(toggleAudio);

        event.scenes.changeScene("titlescreen", event);
    }


    public update(event : ProgramEvent): void {
        
        this.yesNoMenu.update(event);
    }


    public redraw(canvas : Canvas): void {
        
        const TEXT_YOFF : number = 32;
        const BOX_OFF : number = 8;

        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.view(canvas.width, canvas.height);

        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();
        canvas.applyTransform();

        canvas.clear(36, 109, 182);

        const font = canvas.getBitmap("font");

        canvas.setColor();
        canvas.drawText(font, INFO_TEXT, 
            canvas.width/2 - this.textWidth*4,
            TEXT_YOFF, 0, 2);

        const menuShift = (TEXT_YOFF + this.textHeight*10) - canvas.height/2; 

        this.yesNoMenu.draw(canvas, false, 0, menuShift/2 + BOX_OFF);
    }


    public dispose() : SceneParameter {
        
        return undefined;
    }

}
