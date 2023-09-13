//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: gfx/webgl
// File: renderer.ts
// Comment: a WebGL renderer, acts as a "bridge" between the application core
// and the application itself
//


import { RGBA } from "../../math/rgba.js";
import { Vector } from "../../math/vector.js";
import { Bitmap, Canvas, Renderer, TransformTarget } from "../interface.js";
import { WebGLBitmap } from "./bitmap.js";
import { WebGLCanvas } from "./canvas.js";
import { Mesh } from "./mesh.js";
import { Shader } from "./shader.js";
import { FragmentSource, VertexSource } from "./shadersource.js";
import { WebGLTransform } from "./transform.js";


const createCanvasElement = (width : number, height : number) : [HTMLCanvasElement, WebGLRenderingContext | null] => {

    let div = document.createElement("div");
    div.setAttribute("style", "position: absolute; top: 0; left: 0; z-index: -1;");
    
    let canvas = document.createElement("canvas");
    canvas.setAttribute("style", "position: absolute; top: 0; left: 0; z-index: -1;");

    canvas.width = width;
    canvas.height = height;

    div.appendChild(canvas);
    document.body.appendChild(div);

    return [
        canvas, 
        canvas.getContext("webgl", {alpha: false, antialias: true, stencil: true})
    ];
}


const createRectangleMesh = (gl : WebGLRenderingContext) : Mesh =>
    new Mesh(
        gl,
        new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1,
        ]),
        new Uint16Array([
            0, 1, 2, 
            2, 3, 0
        ]),
        new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1
    ]));


const initGL = (gl : WebGLRenderingContext) : void => {

    gl.activeTexture(gl.TEXTURE0);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, 
        gl.ONE_MINUS_SRC_ALPHA, gl.ONE, 
        gl.ONE_MINUS_SRC_ALPHA);

    // TODO: Useless? (leftover from an older project)
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    // gl.stencilMask(0xff);
    // gl.disable(gl.STENCIL_TEST);
}


export enum ShaderType {

    Textured = 0,
    NoTexture = 1,
    FixedColorTextured = 2,
};


export class WebGLRenderer implements Renderer {


    private canvas : WebGLCanvas;

    private htmlCanvas : HTMLCanvasElement;
    private gl : WebGLRenderingContext;

    private screenWidth : number = 1;
    private screenHeight : number = 1;

    private canvasPos : Vector;
    private canvasScale : Vector;

    private meshRect : Mesh;
    private transform : WebGLTransform;

    private shaders : Map<ShaderType, Shader>;
    private activeShader : Shader | undefined = undefined;

    private activeMesh : Mesh | undefined = undefined;
    private activeBitmap : WebGLBitmap | undefined = undefined;
    private activeColor : RGBA;


    constructor(screenWidth : number, screenHeight : number) {

        const [hcanvas, gl] = createCanvasElement(screenWidth, screenHeight);
        if (gl === null) {

            throw new Error("Failed to create a WebGL context!");
        } 

        this.htmlCanvas = hcanvas;
        this.gl = gl;

        initGL(gl);

        this.meshRect = createRectangleMesh(gl);
        this.transform = new WebGLTransform();
        this.transform.setTarget(TransformTarget.Camera);

        this.canvas = new WebGLCanvas(this, screenWidth, screenHeight, this.transform, this.gl);

        this.shaders = new Map<ShaderType, Shader> ();
        this.shaders.set(ShaderType.Textured, 
            new Shader(gl, VertexSource.Textured, FragmentSource.Textured));
        this.shaders.set(ShaderType.NoTexture, 
            new Shader(gl, VertexSource.NoTexture, FragmentSource.NoTexture));
        this.shaders.set(ShaderType.FixedColorTextured, 
            new Shader(gl, VertexSource.Textured, FragmentSource.TexturedFixedColor));
        this.activeShader = this.shaders.get(ShaderType.Textured);

        this.canvasPos = new Vector();
        this.canvasScale = new Vector(1, 1);

        this.activeColor = new RGBA();

        this.resize(window.innerWidth, window.innerHeight);
        window.addEventListener("resize", () => this.resize(window.innerWidth, window.innerHeight));
    }


    public resize(width : number, height : number) : void {

        const gl = this.gl;

        gl.viewport(0, 0, width, height);
        
        this.htmlCanvas.width = width;
        this.htmlCanvas.height = height;

        this.screenWidth = width;
        this.screenHeight = height;

        let m = Math.min(width / this.canvas.width, height / this.canvas.height);
        if (m > 1.0)
            m |= 0;

        this.canvasScale.x = m*this.canvas.width;
        this.canvasScale.y = m*this.canvas.height;

        this.canvasPos.x = width/2 - this.canvasScale.x/2;
        this.canvasPos.y = height/2 - this.canvasScale.y/2;
    }


    public changeShader(type : ShaderType) : void {

        const shader = this.shaders.get(type);
        if (shader === undefined || this.activeShader === shader)
            return;

        this.activeShader = shader;
        shader.use();
        this.transform.use(shader);
    }


    public clear(r : number, g : number, b : number) : void {

        const gl = this.gl;
        gl.clearColor(r, g, b, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }


    public bindTexture(bmp : WebGLBitmap | undefined) : void {

        if (this.activeBitmap === bmp)
            return;

        this.activeBitmap = bmp;
        bmp?.bind(this.gl);
    }   


    public drawMesh(mesh? : Mesh) : void {

        mesh = mesh ?? this.meshRect;

        if (this.activeMesh !== mesh) {

            this.activeMesh = mesh;
            mesh.bind(this.gl);
        }

        mesh.draw(this.gl);
    }


    public setColor(r : number, g : number, b : number, a : number) : void {

        this.activeColor = new RGBA(r, g, b, a);

        this.activeShader?.setColor(r, g, b, a);
    }


    public applyTransform(transform : WebGLTransform) : void {

        if (this.activeShader === undefined)
            return;

        transform.use(this.activeShader);
    }


    public setVertexTransform(x : number = 0, y : number = 0, w : number = 1, h : number = 1) : void {

        this.activeShader?.setVertexTransform(x, y, w, h);
    }


    public setFragmenTransform(x : number = 0, y : number = 0, w : number = 1, h : number = 1) : void {

        this.activeShader?.setFragTransform(x, y, w, h);
    }


    public drawToCanvas(cb: (canvas: Canvas) => void) : void {

        const gl = this.gl;

        this.canvas.setRenderTarget(gl);
        cb(this.canvas);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }


    public refresh() : void {

        const gl = this.gl;
        const shader = this.shaders.get(ShaderType.Textured);
        if (shader === undefined)
            return;

        if (shader !== this.activeShader) {

            shader.use();
        }

        // TODO: Compute in the resize event?
        this.transform.view(this.screenWidth, this.screenHeight);
        this.transform.use(shader);

        shader.setVertexTransform(
            this.canvasPos.x, this.canvasPos.y, 
            this.canvasScale.x, this.canvasScale.y);
        shader.setFragTransform(0, 0, 1, 1);
        shader.setColor(1, 1, 1, 1);
        
        this.meshRect.bind(gl);
        this.canvas.bind(gl);
        this.meshRect.draw(gl);

        gl.bindTexture(gl.TEXTURE_2D, null);

        if (shader !== this.activeShader) {

            this.activeShader?.use();
        }

        this.activeMesh?.bind(gl);
        this.activeBitmap?.bind(gl);
        shader.setColor(
            this.activeColor.r, 
            this.activeColor.g, 
            this.activeColor.b, 
            this.activeColor.a);
    }
    

    public createBitmap(img : HTMLImageElement) : Bitmap {

        const gl = this.gl;

        return new WebGLBitmap(gl, img, false);
    }
}
