//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: gfx/webgl
// File: canvas.ts
// Comment: a WebGL canvas
//

import { Align, Bitmap, Canvas, Flip, Transform2D } from "../interface.js";
import { WebGLBitmap } from "./bitmap.js";
import { WebGLRenderer } from "./renderer.js";



export class WebGLCanvas implements Canvas {


    private framebuffer : WebGLBitmap;


    private readonly renderer : WebGLRenderer;


    public readonly transform: Transform2D;


    get width() : number {

        return this.framebuffer.width;
    }


    get height() : number {

        throw this.framebuffer.height;
    }


    constructor(renderer : WebGLRenderer, width : number, height : number, gl : WebGLRenderingContext) {

        this.framebuffer = new WebGLBitmap(gl, undefined, false, true, width, height);

        this.renderer = renderer;
    }


    clear(r?: number | undefined, g?: number | undefined, b?: number | undefined): void {
        throw new Error("Method not implemented.");
    }
    fillRect(dx?: number | undefined, dy?: number | undefined, dw?: number | undefined, dh?: number | undefined): void {
        throw new Error("Method not implemented.");
    }
    drawBitmap(bmp: Bitmap | undefined, flip?: Flip | undefined, dx?: number | undefined, dy?: number | undefined, sx?: number | undefined, sy?: number | undefined, sw?: number | undefined, sh?: number | undefined, dw?: number | undefined, dh?: number | undefined): void {
        throw new Error("Method not implemented.");
    }
    drawText(font: Bitmap | undefined, text: string, dx: number, dy: number, xoff: number, yoff: number, align?: Align | undefined): void {
        throw new Error("Method not implemented.");
    }
    setColor(r?: number | undefined, g?: number | undefined, b?: number | undefined, a?: number | undefined): void {
        throw new Error("Method not implemented.");
    }
    


    public setRenderTarget(gl : WebGLRenderingContext) : void {

        this.framebuffer.setRenderTarget(gl);
    }
}