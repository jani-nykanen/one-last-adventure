//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: gfx/webgl
// File: renderer.ts
// Comment: a WebGL renderer, acts as a "bridge" between the application core
// and the application itself
//


import { Vector } from "../../math/vector.js";
import { Canvas, Renderer, TransformTarget } from "../interface.js";
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


    constructor(screenWidth : number, screenHeight : number) {

        const [hcanvas, gl] = createCanvasElement(screenWidth, screenHeight);
        if (gl === null) {

            throw new Error("Failed to create a WebGL context!");
        } 

        this.htmlCanvas = hcanvas;
        this.gl = gl;

        this.canvas = new WebGLCanvas(this, screenWidth, screenHeight, this.gl);

        this.meshRect = createRectangleMesh(gl);
        this.transform = new WebGLTransform();
        this.transform.setTarget(TransformTarget.Camera);

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


    public useShader(type : ShaderType) : void {

        this.activeShader = this.shaders.get(type);
        this.activeShader?.use();
    }


    public drawToCanvas(cb: (canvas: Canvas) => void) : void {

        const gl = this.gl;

        this.canvas.setRenderTarget(gl);
        cb(this.canvas);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }


    public refresh() : void {

        const shader = this.shaders.get(ShaderType.Textured);
        if (shader === undefined)
            return;

        if (shader !== this.activeShader) {

            shader.use();
        }

        this.transform.view(this.screenWidth, this.screenHeight);
        this.transform.use(shader);

        shader.setVertexTransform(
            this.canvasPos.x, this.canvasPos.y, 
            this.canvasScale.x, this.canvasScale.y);
        shader.setFragTransform(0, 0, 1, 1);

        // TODO: Something...?

        if (shader !== this.activeShader) {

            this.activeShader?.use();
        }
    }

}
