import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { TransitionType } from "../core/transition.js";
import { Align, Canvas, Flip, TransformTarget } from "../gfx/interface.js";
import { ConfirmationBox } from "../ui/confirmationbox.js";
import { Menu } from "../ui/menu.js";
import { MenuButton } from "../ui/menubutton.js";
import { TextBox } from "../ui/textbox.js";
import { Background, BackgroundType } from "./background.js";
import { LOCAL_STORAGE_SAVE_KEY } from "./savekey.js";



export class TitleScreen implements Scene {


    private menu : Menu | undefined = undefined;
    private error : TextBox;

    private loadGame : boolean = false;

    private background : Background;

    private phase : number = 0;
    private enterTimer : number = 1.0;
    private waveTimer : number = 0.0;


    constructor() {

        this.error = new TextBox();
        this.background = new Background(BackgroundType.IslandDay);
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

        event.transition.activate(true, TransitionType.Circle, 1.0/30.0, event,
            (event : ProgramEvent) => {

                event.scenes.changeScene("game", event);
            });
    }


    public init(param : SceneParameter, event : ProgramEvent): void {
        
        const MUSIC_VOLUME : number = 0.70;

        const text = event.localization?.getItem("titlescreen") ?? [];
        const errors = event.localization?.getItem("save_result") ?? [];

        this.error = new TextBox();

        this.menu = new Menu(
        [

        // New Game
        new MenuButton(text[0] ?? "null",
        (event : ProgramEvent) => {

            event.audio.stopMusic();
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

            event.audio.stopMusic();
            this.goToGame(true, event);
        }),

        // Toggle audio
        new MenuButton(this.getAudioText(text, event),
        (event : ProgramEvent) => {

            if (event.audio.isEnabled()) {

                event.audio.stopMusic();
            }

            if (event.audio.toggle()) {

                event.audio.playMusic(event.assets.getSample("theme_title"), MUSIC_VOLUME);
            }
            this.menu.changeButtonText(2, this.getAudioText(text, event));
        }),
        ], true);

        event.audio.fadeInMusic(event.assets.getSample("theme_title"), MUSIC_VOLUME, 1000);
    }


    public update(event : ProgramEvent): void {
        
        const WAVE_SPEED : number = Math.PI*2.0/120;

        this.background.update(undefined, event);
        this.waveTimer = (this.waveTimer + WAVE_SPEED*event.tick) % (Math.PI*2);

        if (event.transition.isActive())
            return;

        if (this.error.isActive()) {

            this.error.update(event);
            return;
        }

        if (this.phase == 0) {

            this.enterTimer = (this.enterTimer + 1.0/60.0*event.tick) % 1.0;

            if (event.input.getAction("select") == InputState.DownOrPressed) {  

                event.audio.playSample(event.assets.getSample("select"), 0.50);
                ++ this.phase;
            }

            return;
        }
        this.menu.update(event);
        
    }


    public redraw(canvas : Canvas): void {
        
        const bmpLogo = canvas.getBitmap("logo");
        const bmpFont = canvas.getBitmap("font");
        const bmpCorner = canvas.getBitmap("title_corner");
        const bmpFontOutlines = canvas.getBitmap("font_outlines");

        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.view(canvas.width, canvas.height);

        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();
        canvas.applyTransform();

        this.background.draw(canvas);

        canvas.setColor(255, 255, 73);
        canvas.drawText(bmpFont, "*2023 Jani Nyk@nen", 
            canvas.width/2, canvas.height - 10, -1, 0, Align.Center);
        canvas.setColor();

        // canvas.drawBitmap(bmpLogo, Flip.None, canvas.width/2 - (bmpLogo?.width ?? 0)/2, 24);

        if (bmpLogo !== undefined) {

            canvas.drawVerticallyWavingBitmap(bmpLogo, canvas.width/2 - bmpLogo.width/2, 32, Math.PI*2, 8, this.waveTimer);
        }

        if (bmpCorner !== undefined) {

            canvas.drawBitmap(bmpCorner, Flip.None, 
                canvas.width - bmpCorner.width, 
                canvas.height - bmpCorner.height);
        }

        if (this.phase == 0) {

            if (this.enterTimer <= 0.5) {

                canvas.setColor(146, 255, 255);
                canvas.drawText(bmpFontOutlines, "Press ENTER to start", 
                    canvas.width/2, canvas.height - 48, -8, 0, Align.Center);
                canvas.setColor();
            }
            return;
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
