import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { RGBA } from "../math/rgba.js";
import { drawUIBox } from "./box.js";
import { Menu } from "./menu.js";
import { MenuButton } from "./menubutton.js";


export class ConfirmationBox {


    private menu : Menu;

    private message : string[];
    private width : number;
    private height : number;


    constructor(buttonText : string[], message : string, 
        yesEvent : (event : ProgramEvent) => void, 
        noEvent : (event : ProgramEvent) => void) {

        this.message = message.split("\n");
        this.width = Math.max(...this.message.map(s => s.length));
        this.height = this.message.length;

        this.menu = new Menu(
        [
        new MenuButton(buttonText[0], (event : ProgramEvent) => {

            yesEvent(event);
            this.menu.deactivate();
        }),
        new MenuButton(buttonText[1], (event : ProgramEvent) => {
            
            noEvent(event);
            this.menu.deactivate();
        })
        ]);
    }


    public update(event : ProgramEvent) : void {

        this.menu.update(event);
    }


    public draw(canvas : Canvas, 
        x : number = 0, y : number = 0, 
        yoff : number = 10, menuYoff : number = 12,
        boxColors? : RGBA[]) : void {

        const BOX_OFFSET : number = 2;
        const SIDE_OFFSET : number = 2;

        if (!this.menu.isActive())
            return;

        const font = canvas.getBitmap("font");
        const charDim = (font?.width ?? 128)/16;

        const w = (this.width + 1)*charDim;
        const h = (this.height + 1)*yoff + 2*menuYoff;

        const dx = x + canvas.width/2 - w/2;
        const dy = y + canvas.height/2 - h/2; 

        drawUIBox(canvas, 
            dx - BOX_OFFSET, dy - BOX_OFFSET, 
            w + BOX_OFFSET*2, h + BOX_OFFSET*2,
            boxColors);

        for (let i = 0; i < this.message.length; ++ i) {

            canvas.drawText(font, this.message[i], dx + SIDE_OFFSET, dy + SIDE_OFFSET + i*yoff);
        }

        this.menu.draw(canvas, x, dy - menuYoff*2 - SIDE_OFFSET*2, menuYoff, false);
    }


    public activate(cursorPos : number = 0) : void {

        this.menu.activate(cursorPos);
    }


    public deactive() : void {

        this.menu.deactivate();
    }


    public isActive = () : boolean => this.menu.isActive();
}
