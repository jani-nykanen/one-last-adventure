import { ProgramEvent } from "../core/event.js";
import { Canvas, Flip } from "../gfx/interface.js";
import { RGBA } from "../math/rgba.js";
import { drawUIBox } from "./box.js";


export class TextBox {


    private textBuffer : string[];
    private activeText : string | undefined = undefined;

    private charPos : number = 0;
    private charWait : number = 0;
    private finished : boolean = false;

    private active : boolean = false;

    private width : number = 0;
    private height : number = 0;

    private waitWave : number = 0;


    constructor() {   

        this.textBuffer = new Array<string> ();
    }


    private computeDimensions() : void {

        if (this.activeText === undefined)
            return;

        const lines = this.activeText.split("\n");

        this.width = Math.max(...lines.map(s => s.length));
        this.height = lines.length;
    }


    public addText(text : string[]) : void {

        this.textBuffer.push(...text);
    }


    public activate(instant : boolean = false) : void {

        if (this.textBuffer.length == 0)
            return;

        this.activeText = this.textBuffer.shift();
        this.computeDimensions();

        this.charPos = 0;
        this.charWait = 0;
        this.finished = false;

        this.active = true;

        // TODO: Works only if there is only one message
        // in the buffer
        if (instant) {

            this.finished = true;
            this.charPos = this.activeText?.length ?? 0;
        }
    }


    public update(event : ProgramEvent) : void {

        const WAIT_WAVE_SPEED : number = Math.PI*2/60;
        const CHAR_WAIT_TIME : number = 4;

        if (!this.active || this.activeText === undefined)
            return;

        let c : string;

        if (!this.finished) {

            if (event.input.isAnyPressed()) {
                
                this.charPos = this.activeText.length;
                this.finished = true;
                return;
            }

            while ((this.charWait += event.tick) >= CHAR_WAIT_TIME) {

                ++ this.charPos;
                if (this.charPos == this.activate.length) {

                    this.finished = true;
                    break;
                }

                c = this.activeText?.charAt(this.charPos);
                if (c != "\n" && c != " ") {

                    this.charWait -= CHAR_WAIT_TIME;
                }
            }
            return;
        }

        if (this.finished) {

            this.waitWave = (this.waitWave + WAIT_WAVE_SPEED*event.tick) % (Math.PI*2);

            if (event.input.isAnyPressed()) {

                this.activeText = this.textBuffer.shift();
                if (this.activeText === undefined) {

                    this.active = false;
                    return;
                }
                this.computeDimensions();

                this.charPos = 0;
                this.charWait = 0;
            }
        }
    }


    public draw(canvas : Canvas, 
        x : number = 0, y : number = 0, yoff : number = 2,
        drawBox : boolean = true, boxColors? : RGBA[]) : void {

        const BOX_OFFSET : number = 2;
        const SIDE_OFFSET : number = 2;

        if (!this.active)
            return;

        const font = canvas.getBitmap("font");
        const charDim = (font?.width ?? 128)/16;

        const w = this.width*charDim + SIDE_OFFSET*2;
        const h = this.height*(charDim + yoff) + SIDE_OFFSET*2;

        const dx = x + canvas.width/2 - w/2;
        const dy = y + canvas.height/2 - h/2; 

        if (drawBox) {

            drawUIBox(canvas, 
                dx - BOX_OFFSET, dy - BOX_OFFSET, 
                w + BOX_OFFSET*2, h + BOX_OFFSET*2,
                boxColors);
        }

        const str = this.activeText?.substring(0, this.charPos) ?? "";

        canvas.drawText(font, str, dx + SIDE_OFFSET, dy + SIDE_OFFSET, 0, yoff);

        if (this.finished) {

            canvas.setColor(255, 255, 0);
            canvas.drawBitmap(font, Flip.None, 
                dx + w - 4, 
                dy + h - 4 + Math.round(Math.sin(this.waitWave)*1), 
                120, 8, 8, 8);
            canvas.setColor();
        }
    }


    public isActive = () : boolean => this.active;


    public deactivate() : void {

        this.active = false;
    }
}
