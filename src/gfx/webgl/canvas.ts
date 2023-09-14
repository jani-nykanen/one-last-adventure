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
import { ShaderType, WebGLRenderer } from "./renderer.js";


export class WebGLCanvas implements Canvas {


    private framebuffer : WebGLBitmap;


    private readonly renderer : WebGLRenderer;


    public readonly transform: Transform2D;


    get width() : number {

        return this.framebuffer.width;
    }


    get height() : number {

        return this.framebuffer.height;
    }


    constructor(renderer : WebGLRenderer, 
        width : number, height : number, 
        transform : Transform2D,
        gl : WebGLRenderingContext) {

        this.framebuffer = new WebGLBitmap(gl, undefined, false, true, width, height);

        this.renderer = renderer;
        this.transform = transform;
    }


    public clear(r : number = 255, g : number = 255, b : number = 255) : void {

        this.renderer.clear(r/255.0, g/255.0, b/255.0);
    }


    public fillRect(dx = 0, dy = 0, dw = this.width, dh = this.height) : void {

        this.renderer.changeShader(ShaderType.NoTexture);
        this.renderer.setVertexTransform(dx, dy, dw, dh);
    }


    public drawBitmap(bmp : Bitmap | undefined, flip : Flip = Flip.None, 
        dx : number = 0.0, dy : number = 0.0, 
        sx : number = 0.0, sy : number = 0.0, 
        sw : number = bmp?.width ?? 0, sh : number = bmp?.height ?? 0, 
        dw : number = sw, dh : number = sh) : void {
        
        if (bmp === undefined)
            return;

        if ((flip & Flip.Horizontal) == Flip.Horizontal) {

            dx += dw;
            dw *= -1;
        }

        if ((flip & Flip.Vertical) == Flip.Vertical) {

            dy += dh;
            dh *= -1;
        }

        sx /= bmp.width;
        sy /= bmp.height;
        sw /= bmp.width;
        sh /= bmp.height;

        this.renderer.changeShader(ShaderType.Textured);
        this.renderer.setVertexTransform(dx, dy, dw, dh);
        this.renderer.setFragmenTransform(sx, sy, sw, sh);

        this.renderer.bindTexture(bmp as WebGLBitmap);
        this.renderer.drawMesh();
    }


    public drawText(font : Bitmap | undefined, text : string, 
        dx : number, dy : number, xoff : number = 0, yoff : number = 0, 
        align : Align = Align.Left, scalex = 1.0, scaley = 1.0) : void {

        if (font === undefined)
            return;

        const cw = (font.width / 16) | 0;
        const ch = cw;

        let x = dx;
        let y = dy;
        let chr : number;

        if (align == Align.Center) {

            dx -= ((text.length+1) * (cw + xoff)) * scalex / 2.0 ;
            x = dx;
        }
        else if (align == Align.Right) {
            
            dx -= ((text.length) * (cw + xoff)) * scalex;
            x = dx;
        }

        for (let i = 0; i < text.length; ++ i) {

            chr = text.charCodeAt(i);
            if (chr == '\n'.charCodeAt(0)) {

                x = dx;
                y += (ch + yoff) * scaley;
                continue;
            }

            this.drawBitmap(font, Flip.None, 
                x, y, (chr % 16)*cw, ((chr/16) | 0)*ch, 
                cw, ch, cw*scalex, ch*scaley);

            x += (cw + xoff) * scalex;
        }
    }


    public setColor(r : number = 255, g : number = 255, b : number = 255, a : number = 1.0) : void {

        this.renderer.setColor(r/255.0, g/255.0, b/255.0, a);
    }
    

    public setRenderTarget(gl : WebGLRenderingContext) : void {

        this.framebuffer.setRenderTarget(gl);
    }


    public bind(gl : WebGLRenderingContext) : void {

        this.framebuffer.bind(gl);
    }


    public getBitmap = (name : string) : Bitmap | undefined => this.renderer.getBitmap(name);
}
