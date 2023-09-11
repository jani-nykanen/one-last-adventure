//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: gfx/webgl
// File: mesh.ts
// Comment: a WebGL "mesh", stores vertices, uv coordinates etc.
//


export class Mesh {


    private readonly elementCount : number;

    private vertexBuffer : WebGLBuffer | null;
    private uvBuffer : WebGLBuffer | null;
    private indexBuffer : WebGLBuffer | null;


    constructor(gl : WebGLRenderingContext, 
            vertices : Float32Array,     
            indices : Uint16Array,
            textureCoordinates? : Float32Array) {

        this.elementCount = indices.length;

        this.vertexBuffer = gl.createBuffer();
        this.uvBuffer = textureCoordinates === null ? null : gl.createBuffer();
        this.indexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        if (textureCoordinates !== undefined) {

            gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW);      
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }


    public bind(gl : WebGLRenderingContext) : void {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        if (this.uvBuffer != null) {

            gl.enableVertexAttribArray(1);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
            gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
        }
        else {

            gl.disableVertexAttribArray(1);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    }


    public draw(gl : WebGLRenderingContext) : void {
        
        gl.drawElements(gl.TRIANGLES, this.elementCount, gl.UNSIGNED_SHORT, 0);
    }


    public dispose(gl : WebGLRenderingContext) : void {
        
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.indexBuffer);

        if (this.uvBuffer !== null){

            gl.deleteBuffer(this.uvBuffer);
        }
    }
}
