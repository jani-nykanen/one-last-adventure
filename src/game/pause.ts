import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { Menu } from "../ui/menu.js";
import { MenuButton } from "../ui/menubutton.js";
import { ConfirmationBox } from "../ui/confirmationbox.js";
import { TextBox } from "../ui/textbox.js";
import { MusicVolume } from "./musicvolume.js";
import { TransitionType } from "../core/transition.js";


export class PauseMenu {


    private menu : Menu;
    private respawnConfirmation : ConfirmationBox;
    private saveConfirmation : ConfirmationBox;
    private quitConfirmation : ConfirmationBox;

    private saveMessage : TextBox;

    private isSavingOnly : boolean = false;
    

    constructor(event : ProgramEvent, 
        respawnEvent : (event : ProgramEvent) => void,
        saveEvent : (event : ProgramEvent) => boolean,
        quitEvent : (event : ProgramEvent) => void) {

        const text = event.localization?.getItem("menu") ?? [];

        const strYes = event.localization?.getItem("yes")?.[0] ?? "null";
        const strNo = event.localization?.getItem("no")?.[0] ?? "null";
        
        this.saveMessage = new TextBox();

        this.respawnConfirmation = new ConfirmationBox([strYes, strNo], 
            event.localization?.getItem("respawn")?.[0] ?? "null",
            (event : ProgramEvent) => {

                respawnEvent(event);
                this.menu.deactivate();
            },
            (event : ProgramEvent) => {

                // ...
            });

        this.saveConfirmation = new ConfirmationBox([strYes, strNo], 
            event.localization?.getItem("save")?.[0] ?? "null",
            (event : ProgramEvent) => {

                const success = saveEvent(event);

                this.saveMessage.addText(event.localization?.getItem(success ? "save_success" : "save_failure") ?? []);
                this.saveMessage.activate(true);
            },
            (event : ProgramEvent) => {

                // ...
            });

        this.quitConfirmation = new ConfirmationBox([strYes, strNo], 
            event.localization?.getItem("quit")?.[0] ?? "null",
            (event : ProgramEvent) => {

                this.deactivate();
                this.quitConfirmation.deactivate();

                event.transition.activate(true, TransitionType.Circle, 1.0/30.0, quitEvent);
            },
            (event : ProgramEvent) => {

                this.quitConfirmation.deactivate();
            });

        this.menu = new Menu(
        [

        // Resume
        new MenuButton(text[0] ?? "null",
        (event : ProgramEvent) => {

            this.menu.deactivate();

            if (!event.audio.resumeMusic()) {

                event.audio.playMusic(event.assets.getSample("theme_void"), MusicVolume["void"]);
            }
        }),

        // Respawn
        new MenuButton(text[1] ?? "null",
        (event : ProgramEvent) => {

            this.respawnConfirmation.activate(1);
        }),

        // Save game
        new MenuButton(text[2] ?? "null",
        (event : ProgramEvent) => {

            this.saveConfirmation.activate(1);
        }),

        // Toggle audio
        new MenuButton(this.getAudioText(text, event),
        (event : ProgramEvent) => {

            event.audio.toggle();
            this.menu.changeButtonText(3, this.getAudioText(text, event));
        }),

        // Quit
        new MenuButton(text[5] ?? "null",
        (event : ProgramEvent) => {

            this.quitConfirmation.activate(1);
        }),
        ], false);
    }


    private getAudioText(text : string[], event : ProgramEvent) : string {

        return text[4 - Number(event.audio.isEnabled())] ?? "";
    }


    public update(event : ProgramEvent) : void {

        if (this.quitConfirmation.isActive()) {

            this.quitConfirmation.update(event);
            return;
        }

        if (this.saveMessage.isActive()) {

            this.saveMessage.update(event);
            return;
        }

        if (this.saveConfirmation.isActive()) {

            this.saveConfirmation.update(event);
            return;
        }

        if (this.isSavingOnly) {

            this.deactivate();
            return;
        }

        if (this.respawnConfirmation.isActive()) {

            this.respawnConfirmation.update(event);
            return;
        }

        this.menu.update(event);
    }


    public draw(canvas : Canvas) : void {

        const DARKEN_ALPHA : number = 0.50;

        if (!this.menu.isActive())
            return;

        if (!this.isSavingOnly) {
            
            canvas.setColor(0, 0, 0, DARKEN_ALPHA);
            canvas.fillRect();
        }

        if (this.saveMessage.isActive()) {

            this.saveMessage.draw(canvas);
            return;
        }

        if (this.saveConfirmation.isActive()) {

            this.saveConfirmation.draw(canvas);
            return;
        }

        if (this.isSavingOnly)
            return;

        if (this.quitConfirmation.isActive()) {

            this.quitConfirmation.draw(canvas);
            return;
        }

        if (this.respawnConfirmation.isActive()) {

            this.respawnConfirmation.draw(canvas);
            return;
        }

        this.menu.draw(canvas, 0, 0, 12, true);
    }


    public activate(savingOnly : boolean = false) : void {

        this.isSavingOnly = savingOnly;
        this.menu.activate(0);

        if (savingOnly) {

            this.saveConfirmation.activate(1);
        }
    }


    public deactivate() : void {

        this.saveConfirmation.deactivate();
        this.saveMessage.deactivate();
        this.respawnConfirmation.deactivate();
        this.quitConfirmation.deactivate();
        this.menu.deactivate();

        this.isSavingOnly = false;
    }


    public isActive = () : boolean => this.menu.isActive();
}
