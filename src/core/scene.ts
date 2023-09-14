//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: core
// File: scene.ts
// Comment: scene interface
//


import { Canvas } from "../gfx/interface.js";
import { ProgramEvent } from "./event.js";


export type SceneParameter = number | string | undefined;


export interface Scene {
    
    init?(param : SceneParameter, event : ProgramEvent) : void;
    update(event : ProgramEvent) : void;
    redraw(canvas : Canvas) : void;
    dispose() : SceneParameter;
}
