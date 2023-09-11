import { Canvas, Renderer } from "../interface.js";
import { WebGLCanvas } from "./canvas.js";


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



export class WebGLRenderer implements Renderer {


    private canvas : WebGLCanvas;

    private htmlCanvas : HTMLCanvasElement;
    private gl : WebGLRenderingContext;

    private canvasWidth : number = 1;
    private canvasHeight : number = 1;


    constructor(canvasWidth : number, canvasHeight : number) {

        const [hcanvas, glCtx] = createCanvasElement(canvasWidth, canvasHeight);
        if (glCtx === null) {

            throw new Error("Failed to create a WebGL context!");
        } 

        this.htmlCanvas = hcanvas;
        this.gl = glCtx;

        this.canvas = new WebGLCanvas(this, canvasWidth, canvasHeight, this.gl);

        this.resize(window.innerWidth, window.innerHeight);
        window.addEventListener("resize", () => this.resize(window.innerWidth, window.innerHeight));
    }


    public resize(width : number, height : number): void {

        const gl = this.gl;

        gl.viewport(0, 0, width, height);
        
        this.htmlCanvas.width = width;
        this.htmlCanvas.height = height;

        this.canvasWidth = width;
        this.canvasHeight = height;
    }


    public drawToCanvas(cb: (canvas: Canvas) => void) : void {

        const gl = this.gl;

        this.canvas.setRenderTarget(gl);
        cb(this.canvas);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }


    public refresh() : void {


    }

}
