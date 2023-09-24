import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { next } from "./existingobject.js";
import { FlyingMessage, FlyingMessageSymbol } from "./flyingmessage.js";
import { RGBA } from "../math/rgba.js";



export class FlyingMessageGenerator {


    private messages : FlyingMessage[];


    constructor() {

        this.messages = new Array<FlyingMessage> ();
    }


    public spawn(x : number, y : number, value : number, 
        symbol : FlyingMessageSymbol = FlyingMessageSymbol.None, 
        color : RGBA = new RGBA(255, 255, 255)) : void {

        (next(this.messages, FlyingMessage) as FlyingMessage)
            .spawn(x, y, value, symbol, color);
    }


    public update(event : ProgramEvent) : void {

        for (let m of this.messages) {

            m.update(event);
        }
    }


    public draw(canvas : Canvas) : void {

        const bmp = canvas.getBitmap("tiny_font");

        for (let m of this.messages) {

            m.draw(canvas, bmp);
        }
    }
}
