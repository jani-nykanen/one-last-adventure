//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: gfx/webgl
// File: canvas.ts
// Comment: a WebGL canvas
//

import { clamp } from "../../math/utility.js";
import { Align, Bitmap, Canvas, Flip, Transform2D } from "../interface.js";
import { WebGLBitmap } from "./bitmap.js";
import { Mesh } from "./mesh.js";
import { ShaderType, WebGLRenderer } from "./renderer.js";


const createCircleOutMesh = (gl : WebGLRenderingContext, quality : number) : Mesh => {

    const step = Math.PI*2/quality;

    const vertices = new Array<number> ();
    const indices = new Array<number> ();

    let angle1 : number;
    let angle2 : number;
    
    let c1 : number;
    let c2 : number;
    let s1 : number;
    let s2 : number;

    let index : number = 0;

    for (let i = 0; i < quality; ++ i) {

        angle1 = step*i;
        angle2 = step*(i + 1);

        c1 = Math.cos(angle1);
        c2 = Math.cos(angle2);

        s1 = Math.sin(angle1);
        s2 = Math.sin(angle2);

        vertices.push(
            c1, s1, 
            c2, s2,
            c2*2, s2*2,

            c2*2, s2*2,
            c1*2, s1*2,
            c1, s1);

        for (let j = 0; j < 6; ++ j) {

            indices.push(index ++);
        }
    }

    return new Mesh(gl, new Float32Array(vertices), new Uint16Array(indices));
}


export class WebGLCanvas implements Canvas {


    private framebuffer : WebGLBitmap;
    private cloneTexture : WebGLBitmap;

    private meshCircleOut : Mesh;

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
        this.cloneTexture = new WebGLBitmap(gl, undefined, false, false, width, height);

        this.renderer = renderer;
        this.transform = transform;

        this.meshCircleOut = createCircleOutMesh(gl, 64);
    }


    public clear(r : number = 255, g : number = 255, b : number = 255) : void {

        this.renderer.clear(r/255.0, g/255.0, b/255.0);
    }


    public fillRect(dx = 0, dy = 0, dw = this.width, dh = this.height) : void {

        this.renderer.changeShader(ShaderType.NoTexture);
        this.renderer.setVertexTransform(dx, dy, dw, dh);

        this.renderer.drawMesh();
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

            dx -= ((text.length)*(cw + xoff))*scalex / 2.0 ;
            x = dx;
        }
        else if (align == Align.Right) {
            
            dx -= ((text.length)*(cw + xoff))*scalex;
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


    public fillCircleOutside(centerx : number, centery : number, radius : number) : void {

        this.renderer.changeShader(ShaderType.NoTexture);

        // Center
        this.renderer.setVertexTransform(centerx, centery, radius, radius);
        this.renderer.drawMesh(this.meshCircleOut);

        // Borders
        const top = Math.max(0, centery - radius) | 0;
        const bottom = Math.min(this.height, centery + radius) | 0;
        const left = Math.max(centerx - radius, 0) | 0;
        const right = Math.min(centerx + radius, this.width) | 0;

        if (top > 0)
            this.fillRect(0, 0, this.width, top);
        if (bottom < this.height)
            this.fillRect(0, bottom, this.width, this.height - bottom);
        if (left > 0)
            this.fillRect(0, 0, left, this.width);
        if (right < this.width)
            this.fillRect(right, 0, this.width - right, this.height);
    }
    

    public drawHorizontallyWavingBitmap(bitmap : Bitmap | undefined, 
        amplitude : number, period : number, shift : number,
        dx : number = 0, dy : number = 0, flip : Flip = Flip.None) : void {

        if (bitmap === undefined)
            return;

        // Note: For better performance one should obviously do this in
        // a shader, but I'm lazy

        let phase = shift;
        let phaseStep = Math.PI*2 / period;

        let x : number;
        let sy : number;

        for (let y = 0; y < bitmap.height; ++ y) {

            phase = shift + phaseStep*y;

            x = dx + Math.round(Math.sin(phase)*amplitude);

            sy = (flip & Flip.Vertical) != 0 ? (bitmap.height - 1) - y : y;
            this.drawBitmap(bitmap, Flip.Horizontal & flip, x, dy + y, 0, sy, bitmap.width, 1);
        }
    }


    public drawVerticallyWavingBitmap(bmp : Bitmap,
        dx : number, dy : number, period : number, amplitude : number,
        shift : number) : void {

        let y : number;
        let t : number;
        for (let x = 0; x < bmp.width; ++ x) {

            t = shift + (x / bmp.width)*period;
            y = Math.round(Math.sin(t)*amplitude);

            this.drawBitmap(bmp, Flip.None, dx + x, dy + y, x, 0, 1, bmp.height);
        }
    }


    public setColor(r : number = 255, g : number = r, b : number = g, a : number = 1.0) : void {

        this.renderer.setColor(r/255.0, g/255.0, b/255.0, a);
    }
    

    public setRenderTarget() : void {

        this.framebuffer.setRenderTarget();
    }


    public bind() : void {

        this.framebuffer.bind();
    }


    public getBitmap = (name : string) : Bitmap | undefined => this.renderer.getBitmap(name);
    public getCloneBufferBitmap = () : Bitmap => this.cloneTexture;


    public applyTransform() : void {

        this.renderer.applyTransform();
    }


    public cloneToBufferBitmap() : void {

        this.renderer.nullActiveBitmap();
        this.framebuffer.cloneToBitmap(this.cloneTexture);
    }
}
