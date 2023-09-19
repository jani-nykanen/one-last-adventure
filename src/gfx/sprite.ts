//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: gfx
// File: sprite.ts
// Comment: a class for animating simple sprites
//


import { Bitmap } from "./interface.js";
import { Canvas, Flip } from "./interface.js";


export class Sprite {


    private column : number = 0;
    private row : number = 0;
    private timer : number = 0.0;

    public readonly width : number;
    public readonly height : number;


    constructor(width : number, height : number) {

        this.width = width;
        this.height = height;
    }


    private nextFrame(dir : number, startFrame : number, endFrame : number) : void {

        this.column += dir;

        const min = Math.min(startFrame, endFrame);
        const max = Math.max(startFrame, endFrame);

        if (this.column < min)
            this.column = max;
        else if (this.column > max)
            this.column = min;
    } 

    
    public animate(row : number,
        startFrame : number, endFrame : number, 
        frameTime : number, step : number) : void {

        const dir = Math.sign(endFrame - startFrame);

        if (row != this.row) {
            
            this.column = startFrame;
            this.timer = 0;

            this.row = row;
        }

        if (frameTime <= 0) {

            this.nextFrame(dir, startFrame, endFrame);
            return;
        }

        this.timer += step;
        while (this.timer >= frameTime) {

            this.timer -= frameTime;
            this.nextFrame(dir, startFrame, endFrame);
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined, 
        dx : number, dy : number, flip : Flip = Flip.None,
        scalex : number = this.width, scaley : number = this.height) : void {

        canvas.drawBitmap(bmp, flip, 
            dx, dy, 
            this.column*this.width, this.row*this.height, 
            this.width, this.height, scalex, scaley);
    }


    public setFrame(column : number, row : number) : void {

        this.column = column;
        this.row = row;

        this.timer = 0.0;
    }


    public getColumn = () : number => this.column;
    public getRow = () : number => this.row;
}
