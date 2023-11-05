import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Canvas, Flip, TransformTarget } from "../gfx/interface.js";
import { drawUIBox } from "../ui/box.js";
import { ConfirmationBox } from "../ui/confirmationbox.js";
import { Menu } from "../ui/menu.js";
import { MenuButton } from "../ui/menubutton.js";



export class AudioIntro implements Scene {


    private yesNoMenu : Menu;

    private textWidth : number;
    private textHeight : number;

    private text : string;

    private audioMode : number = 0;


    public init(param : SceneParameter, event : ProgramEvent): void {
        
        const strYes = event.localization?.getItem("yes")?.[0] ?? "null";
        const strNo = event.localization?.getItem("no")?.[0] ?? "null";

        this.yesNoMenu = new Menu(
            [
            new MenuButton(strYes, 
                (event : ProgramEvent) => {

                    this.goToNextScene(true, event);
                }),
            
            new MenuButton(strNo, 
                (event : ProgramEvent) => {
    
                    this.goToNextScene(false, event);
                })
        ], true);
        // this.yesNoMenu.activate(0);

        this.text = (event.localization?.getItem("audio_intro") ?? [""])[0];

        const lines = this.text.split("\n");
        this.textWidth = Math.max(...lines.map(s => s.length));
        this.textHeight = lines.length;
        
    }


    private goToNextScene(toggleAudio : boolean, event : ProgramEvent) : void {

        event.audio.toggle(toggleAudio);

        event.scenes.changeScene("intro", event);
    }


    public update(event : ProgramEvent): void {
        
        this.yesNoMenu.update(event);

        this.audioMode = this.yesNoMenu.getCursorPos();
    }


    public redraw(canvas : Canvas): void {
        
        const TEXT_YOFF : number = 44;
        const BOX_OFF : number = 8;
        const BOX_TOP : number = 8;

        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.view(canvas.width, canvas.height);

        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();
        canvas.applyTransform();

        canvas.clear(36, 109, 182);

        const font = canvas.getBitmap("font");
        const bmpNote = canvas.getBitmap("note");

        canvas.setColor();

        const dx = canvas.width/2 - this.textWidth*4;

        drawUIBox(canvas, dx - 4, BOX_TOP, (this.textWidth+1)*8, (this.textHeight+1)*10 + 32);

        canvas.drawBitmap(bmpNote, Flip.None, canvas.width/2 - 16, 12, this.audioMode*32, 0, 32, 32);

        canvas.drawText(font, this.text, 
            canvas.width/2 - this.textWidth*4,
            TEXT_YOFF, 0, 2);

        const menuShift = (TEXT_YOFF + this.textHeight*16) - canvas.height/2 + 28; 

        this.yesNoMenu.draw(canvas, 0, menuShift/2 + BOX_OFF, 12, true);
    }


    public dispose() : SceneParameter {
        
        return undefined;
    }

}
