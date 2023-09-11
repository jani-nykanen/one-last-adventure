//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: gfx/webgl
// File: bitmap.ts
// Comment: a WebGL bitmap
//

import { Bitmap } from "../interface.js";


export class WebGLBitmap implements Bitmap {


    private texture : WebGLTexture | null = null;
    private framebuffer : WebGLFramebuffer | null = null;

    private readonly gl : WebGLRenderingContext;

    public readonly width : number;
    public readonly height : number;


    constructor(gl : WebGLRenderingContext, 
        image : HTMLImageElement | undefined, linearFilter = false,
        makeFramebuffer = false, width = 256, height = 256) {

        this.texture = gl.createTexture();
        this.gl = gl;

        const filter = linearFilter ? gl.LINEAR : gl.NEAREST;

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            
        if (image !== undefined) {

            gl.texImage2D(gl.TEXTURE_2D, 
                0, gl.RGBA, gl.RGBA, 
                gl.UNSIGNED_BYTE, image);

            this.width = image.width;
            this.height = image.height;
        }
        else {

            gl.texImage2D(gl.TEXTURE_2D, 
                0, gl.RGBA, width, height, 0, 
                gl.RGBA, gl.UNSIGNED_BYTE, null);

            this.width = width;
            this.height = height;
        }

        if (makeFramebuffer) {

            this.framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                gl.TEXTURE_2D, this.texture, 0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
    }


    public bind(gl : WebGLRenderingContext) : void {

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }


    public setRenderTarget(gl : WebGLRenderingContext) : void {

        if (this.framebuffer === null) return;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    }
}
