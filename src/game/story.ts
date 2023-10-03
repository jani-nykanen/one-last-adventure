import { ProgramEvent } from "../core/event.js";
import { Canvas, Flip } from "../gfx/interface.js";
import { Menu } from "../ui/menu.js";
import { MenuButton } from "../ui/menubutton.js";
import { ConfirmationBox } from "../ui/confirmationbox.js";
import { TextBox } from "../ui/textbox.js";
import { MusicVolume } from "./musicvolume.js";
import { TransitionType } from "../core/transition.js";
import { Vector } from "../math/vector.js";


export class Story {


    private textbox : TextBox;

    private fadeTimer : number = 1.0;
    private played : boolean = true;


    constructor() {

        this.textbox = new TextBox();
    }


    public activate(initial : boolean, event : ProgramEvent) : void {

        const text = event.localization?.getItem(initial ? "story_intro" : "story_outro") ?? [];

        this.played = false;

        this.textbox.addText(text);
        this.textbox.activate(false, (event : ProgramEvent) => {

            this.textbox.deactivate();
            this.fadeTimer = 1.0;

            event.audio.fadeInMusic(event.assets.getSample("theme_void"), MusicVolume["void"], 1000);
        });
    }


    public update(event : ProgramEvent) : void {

        const FADE_SPEED : number = 1.0/30.0;

        if (this.played)
            return;

        if (this.textbox.isActive()) {

            this.textbox.update(event);
            return;
        }

        this.fadeTimer -= FADE_SPEED*event.tick;
        if (this.fadeTimer <= 0.0) {

            this.fadeTimer = 0.0;
            this.played = true;
        }
    }


    public draw(canvas : Canvas, playerPos : Vector) : void {

        if (this.played)
            return;

        const bmpPlayer = canvas.getBitmap("player");

        canvas.setColor(0, 0, 0, this.fadeTimer);
        canvas.fillRect();

        canvas.setColor();
        this.textbox.draw(canvas, 0, 0, 4, false);

        canvas.drawBitmap(bmpPlayer, Flip.None, 
            playerPos.x - 8, playerPos.y - 7, 64, 48, 16, 16);
    }


    public isPlayed = () : boolean => this.played;
}
