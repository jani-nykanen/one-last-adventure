import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { negMod } from "../math/utility.js";
import { Canvas } from "../gfx/interface.js";
import { MenuButton } from "./menubutton.js";
import { RGBA } from "../math/rgba.js";
import { drawUIBox } from "./box.js";


export class Menu {


    private buttons : Array<MenuButton>;

    private cursorPos : number = 0;
    private active : boolean = false;
    
    private maxLength : number;


    constructor(buttons : Array<MenuButton>, makeActive : boolean = false) {

        this.buttons = buttons.map((_, i) => buttons[i].clone());
        this.maxLength = Math.max(...this.buttons.map(b => b.getText().length));

        this.active = makeActive;
    }


    public activate(cursorPos = this.cursorPos) : void {

        this.cursorPos = cursorPos % this.buttons.length;
        this.active = true;
    }


    public update(event : ProgramEvent) : void {

        if (!this.active) return;

        const oldPos = this.cursorPos;

        if (event.input.upPress()) {

            -- this.cursorPos;
        }
        else if (event.input.downPress()) {

            ++ this.cursorPos;
        }

        if (oldPos != this.cursorPos) {

            this.cursorPos = negMod(this.cursorPos, this.buttons.length);
            event.audio.playSample(event.assets.getSample("choose"), 0.60);
        }

        if (event.input.getAction("select") == InputState.Pressed) {

            this.buttons[this.cursorPos].evaluateCallback(event);
            event.audio.playSample(event.assets.getSample("select"), 0.60);
        }
    }


    public draw(canvas : Canvas,
        x : number = 0, y : number = 0, yoff : number = 12, 
        drawBox : boolean = true, boxColors : RGBA[] | undefined = undefined) : void {

        const BOX_OFFSET : number = 2;
        const SIDE_OFFSET : number = 2;

        if (!this.active) return;

        const font = canvas.getBitmap("font");
        const charDim = (font?.width ?? 128)/16;

        const w = (this.maxLength + 1)*charDim;
        const h = this.buttons.length*yoff;

        const dx = x + canvas.width/2 - w/2;
        const dy = y + canvas.height/2 - h/2; 

        if (drawBox) {

            drawUIBox(canvas, 
                dx - BOX_OFFSET, dy - BOX_OFFSET, 
                w + BOX_OFFSET*2, h + BOX_OFFSET*2,
                boxColors);
        }


        for (let i = 0; i < this.buttons.length; ++ i) {

            if (i == this.cursorPos) {

                canvas.setColor(255, 255, 73);
            }
            else {

                canvas.setColor();
            }
            canvas.drawText(font, this.buttons[i].getText(), 
                dx + SIDE_OFFSET, dy + SIDE_OFFSET + i*yoff);
        } 
    }


    public isActive = () : boolean => this.active;


    public deactivate() : void {

        this.active = false;
    }


    public changeButtonText(index : number, text : string) : void {

        this.buttons[index].changeText(text);
    }
}
