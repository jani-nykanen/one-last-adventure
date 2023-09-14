//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: core
// File: scenemanager.ts
// Comment: manages different scenes
//


import { Canvas } from "../gfx/interface.js";
import { ProgramEvent } from "./event.js";
import { Scene } from "./scene.js";


export class SceneManager {


    private scenes : Map<string, Scene>;
    private activeScene : Scene | undefined = undefined;


    constructor() {

        this.scenes = new Map<string, Scene> ();
    }


    public addScene(name : string, scene : Scene) : void {

        this.scenes.set(name, scene);
        this.activeScene = scene;
        
    }

    public init(event : ProgramEvent) : void {

        this.activeScene?.init?.(undefined, event);
    }


    public update(event : ProgramEvent) : void {

        this.activeScene?.update(event);
    }


    public redraw(canvas : Canvas) : void {

        this.activeScene?.redraw(canvas);
    }


    public changeScene(name : string, event : ProgramEvent) : void {

        const s = this.scenes.get(name);
        const param = s?.dispose();

        this.activeScene = this.scenes.get(name);
        this.activeScene?.init?.(param, event)
    }
}