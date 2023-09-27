import { GameObject } from "./gameobject.js";
import { ProgramEvent } from "../core/event.js";
import { Camera } from "./camera.js";
import { Canvas, Bitmap } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";


export class Hint extends GameObject {


    private activated : boolean = false;

    private text : string;

    private width : number;
    private height : number;


    constructor(x : number, y : number, text : string, forceActive : boolean = false) {

        super(x, y, true);

        this.text = text;

        const lines = this.text.split("\n");

        this.width = Math.max(...lines.map(s => s.length));
        this.height = lines.length;

        this.cameraCheckArea = new Vector(1, 1);

        if (forceActive) {

            this.activated = true;
            this.inCamera = true;
        }
    }


    protected cameraEvent(enteredCamera : boolean, camera : Camera, event : ProgramEvent) : void {
        
        if (enteredCamera) {

            this.activated = true;
        } 
    }


    public draw(canvas : Canvas) : void {
        
        const Y_OFFSET : number = 16;
        const BOX_OFFSET : number = 2;
        const BOX_ALPHA : number = 0.50;
        const TEXT_Y_OFF : number = 2;

        if (!this.exist || !this.inCamera || !this.activated)
            return;

        const font = canvas.getBitmap("font");

        const charDim = (font?.width ?? 128)/16;

        const w = charDim*this.width;
        const h = (charDim + TEXT_Y_OFF)*this.height;

        const dx = canvas.width/2 - w/2;
        const dy = Y_OFFSET;

        canvas.setColor(0, 0, 0, BOX_ALPHA);
        canvas.fillRect(
            dx - BOX_OFFSET, dy - BOX_OFFSET, 
            w + BOX_OFFSET*2, h + BOX_OFFSET*2);
        canvas.setColor(255, 255, 73);

        canvas.drawText(font, this.text, dx, dy, 0, TEXT_Y_OFF);

        canvas.setColor();
    }


    public isActivated = () : boolean => this.activated;
}
