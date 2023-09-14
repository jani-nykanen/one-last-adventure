//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: core
// File: transition.ts
// Comment: screen transition manager
//


import { RGBA } from "../math/rgba.js";
import { Canvas } from "../gfx/interface.js";
import { ProgramEvent } from "./event.js";


export const enum TransitionType {
    None = 0,
    Fade = 1,
    Circle = 2
};


export class Transition {


    private timer : number = 1.0;
    private fadeOut : boolean = false;
    private effectType : TransitionType = TransitionType.None;
    private active : boolean = false;
    private speed : number = 1.0;
    private color : RGBA;
    
    private callback : ((event : ProgramEvent) => void) = (() => {});


    constructor() {

        this.color = new RGBA(0, 0, 0);
    }


    public activate(fadeOut : boolean, type : TransitionType, speed : number, 
        callback : (event : ProgramEvent) => any, color : RGBA = new RGBA(0, 0, 0)) : void {

        this.fadeOut = fadeOut;
        this.speed = speed;
        this.timer = 1.0;
        this.callback = callback;
        this.effectType = type;
        this.color = color;

        this.active = true;
    }


    public update(event : ProgramEvent) : void {

        if (!this.active) 
            return;

        this.timer -= this.speed*event.tick;
        if (this.timer <= 0) {

            this.fadeOut = !this.fadeOut;
            if (!this.fadeOut) {

                this.timer += 1.0;
                this.callback(event);
                return;
            }

            this.active = false;
            this.timer = 0;
        }
    }


    public draw(canvas : Canvas) : void {

        if (!this.active || this.effectType == TransitionType.None)
            return;

        let t = this.timer;
        if (this.fadeOut)
            t = 1.0 - t;

        let maxRadius : number;
        let radius : number;

        switch (this.effectType) {

        case TransitionType.Fade:

            canvas.setColor(this.color.r, this.color.g, this.color.b, t);
            canvas.fillRect(0, 0, canvas.width, canvas.height);
            break;

        case TransitionType.Circle:

            maxRadius = Math.max(
                Math.hypot(canvas.width/2, canvas.height/2),
                Math.hypot(canvas.width - canvas.width/2, canvas.height/2),
                Math.hypot(canvas.width - canvas.width/2, canvas.height - canvas.height/2),
                Math.hypot(canvas.width/2, canvas.height - canvas.height/2)
            );

            radius = (1 - t) * maxRadius;
            canvas.setColor(0, 0, 0);
            // TODO: Implement the following function
            // canvas.fillCircleOutside(radius);

            break;

        default:
            break;
        }
    }


    public isActive = () : boolean => this.active;
    public isFadingOut = () : boolean => this.active && this.fadeOut;

    
    public deactivate() : void {

        this.active = false;
    }
}
