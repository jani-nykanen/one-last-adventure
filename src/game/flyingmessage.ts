import { ExistingObject } from "./existingobject.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { RGBA } from "../math/rgba.js";


export const enum FlyingMessageSymbol {

    None = 0,
    Coin = 1,
    Heart = 2
};


export class FlyingMessage implements ExistingObject {


    private exist : boolean = false;

    private value : number = 0;
    private symbol : FlyingMessageSymbol = FlyingMessageSymbol.None;

    private pos : Vector;
    private timer : number = 0;

    private color : RGBA;


    constructor() {

        this.pos = new Vector();

        this.color = new RGBA();
    }


    public spawn(x : number, y : number, value : number, 
        symbol : FlyingMessageSymbol = FlyingMessageSymbol.None,
        color : RGBA = new RGBA(255, 255, 255)) : void {
        
        this.pos.x = x;
        this.pos.y = y;

        this.value = value;
        this.symbol = symbol;

        this.timer = 0;

        this.color = color.clone();

        this.exist = true;
    }


    public update(event : ProgramEvent) : void {

        const FLY_TIME : number = 16;
        const FLY_SPEED : number = -1.5;
        const WAIT_TIME : number = 30;

        if (!this.exist)
            return;

        this.timer += event.tick;
        if (this.timer < FLY_TIME) {

            this.pos.y += FLY_SPEED*event.tick;
        }

        if (this.timer >= FLY_TIME + WAIT_TIME) {

            this.exist = false;
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {

        if (!this.exist)
            return;

        const len = String(this.value).length*6 + Math.sign(this.symbol)*8;

        const dx = Math.round(this.pos.x) - len/2;
        const dy = Math.round(this.pos.y) - 8;

        let sx : number;

        canvas.setColor(this.color.r, this.color.g, this.color.b, this.color.a);

        // TODO: Modify the font (i.e add empty space) so one can use
        // the ordinary drawText function, this thing here is a bit silly

        // Sign
        sx = this.value >= 0 ? 80 : 88;
        canvas.drawBitmap(bmp, Flip.None, dx, dy, sx, 8, 8, 8);

        // Number
        const str = String(Math.abs(this.value) | 0);

        for (let i = 0; i < str.length; ++ i) {

            sx = (Number(str.charAt(i)))*8;
            canvas.drawBitmap(bmp, Flip.None, dx + (i + 1)*6, dy, sx, 8, 8, 8);
        }

        canvas.setColor();

        // Symbol
        if (this.symbol != FlyingMessageSymbol.None) {

            canvas.drawBitmap(bmp, Flip.None, 
                dx + (str.length + 1)*6, dy, 
                (this.symbol - 1)*8, 0, 8, 8);
        }
    }


    public doesExist() : boolean {

        return this.exist;
    }


    public isDying() : boolean {
        
        return false;
    }

    public forceKill() : void {
        
        this.exist = false;
    }
    
}
