import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { TransitionType } from "../core/transition.js";
import { Canvas, Flip, TransformTarget } from "../gfx/interface.js";
import { ConfirmationBox } from "../ui/confirmationbox.js";
import { Menu } from "../ui/menu.js";
import { MenuButton } from "../ui/menubutton.js";
import { TextBox } from "../ui/textbox.js";
import { LOCAL_STORAGE_SAVE_KEY } from "./savekey.js";



export class TitleScreen implements Scene {


    private menu : Menu | undefined = undefined;
    private error : TextBox;

    private loadGame : boolean = false;


    constructor() {

        this.error = new TextBox();
    }


    private getAudioText(text : string[], event : ProgramEvent) : string {

        return text[3 - Number(event.audio.isEnabled())] ?? "";
    }


    private checkSave() : number {

        try {

            if (window["localStorage"]["getItem"](LOCAL_STORAGE_SAVE_KEY) === null) {

                return 1;
            }
        }
        catch(e : any) {

            console.warn("Error loading the game: " + e["message"]);
            return 2;
        }
        return 0;
    }


    private goToGame(loadGame : boolean, event : ProgramEvent) : void {

        this.loadGame = loadGame;

        event.transition.activate(true, TransitionType.Circle, 1.0/30.0, 
            (event : ProgramEvent) => {

                event.scenes.changeScene("game", event);
            });
    }


    public init(param : SceneParameter, event : ProgramEvent): void {
        
        const text = event.localization?.getItem("titlescreen") ?? [];
        const errors = event.localization?.getItem("save_result") ?? [];

        this.error = new TextBox();

        this.menu = new Menu(
        [

        // New Game
        new MenuButton(text[0] ?? "null",
        (event : ProgramEvent) => {

            this.goToGame(false, event);
        }),

        // Continue
        new MenuButton(text[1] ?? "null",
        (event : ProgramEvent) => {

            const saveResult = this.checkSave();
            if (saveResult != 0) {

                this.error.addText([errors[saveResult - 1]] ?? [""]);
                this.error.activate(true);
                return;
            }

            this.goToGame(true, event);
        }),

        // Toggle audio
        new MenuButton(this.getAudioText(text, event),
        (event : ProgramEvent) => {

            event.audio.toggle();
            this.menu.changeButtonText(2, this.getAudioText(text, event));
        }),
        ], true);
    }


    public update(event : ProgramEvent): void {
        
        if (event.transition.isActive())
            return;

        if (this.error.isActive()) {

            this.error.update(event);
            return;
        }

        this.menu.update(event);
    }


    public redraw(canvas : Canvas): void {
        
        const CLOUD_Y : number = 88;

        const bmpSky = canvas.getBitmap("sky_day");
        const bmpClouds = canvas.getBitmap("clouds_day");

        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.view(canvas.width, canvas.height);

        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();
        canvas.applyTransform();

        canvas.setColor();
        canvas.drawBitmap(bmpSky);

        const waterY = CLOUD_Y + (bmpClouds?.height ?? 0);

        canvas.setColor(109, 109, 182);
        canvas.fillRect(0, waterY, canvas.width, canvas.height - waterY);

        canvas.setColor();
        for (let i = 0; i < 2; ++ i) {

            canvas.drawBitmap(bmpClouds, Flip.None, i*128, CLOUD_Y);
        }

        this.menu.draw(canvas, 0, 32);

        if (this.error.isActive()) {

            canvas.setColor(0, 0, 0, 0.50);
            canvas.fillRect();

            this.error.draw(canvas);
        }
    }


    public dispose() : SceneParameter {
        
        return Number(this.loadGame);
    }

}
