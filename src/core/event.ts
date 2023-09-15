//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: core
// File: event.ts
// Comment: I have no idea how to explain this thing
// so I won't even try.
//


import { AudioPlayer } from "../audio/audioplayer.js";
import { Renderer } from "../gfx/interface.js";
import { Assets } from "./assets.js";
import { Input } from "./input.js";
import { SceneManager } from "./scenemanager.js";
import { Transition } from "./transition.js";


export class ProgramEvent {


    public readonly input : Input;
    public readonly audio : AudioPlayer;
    public readonly assets : Assets;
    public readonly transition : Transition;
    public readonly scenes : SceneManager;

    public readonly tick : number = 1.0;

    public readonly screenWidth : number;
    public readonly screenHeight : number;


    constructor(renderer : Renderer) {

        this.input = new Input();
        this.audio = new AudioPlayer(0.60);
        this.assets = new Assets(this.audio, renderer);
        this.transition = new Transition();
        this.scenes = new SceneManager();

        this.screenWidth = renderer.width;
        this.screenHeight = renderer.height;

        renderer.setFetchBitmapCallback((name : string) => this.assets.getBitmap(name));
    }
}
