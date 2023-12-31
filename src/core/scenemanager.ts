import { Canvas } from "../gfx/interface.js";
import { ProgramEvent } from "./event.js";
import { Scene } from "./scene.js";


export class SceneManager {


    private scenes : Map<string, Scene>;
    private activeScene : Scene | undefined = undefined;


    constructor() {

        this.scenes = new Map<string, Scene> ();
    }


    public addScene(name : string, scene : Scene, makeActive : boolean = true) : void {

        this.scenes.set(name, scene);
        if (makeActive) {

            this.activeScene = scene;
        }
        
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

        const param = this.activeScene?.dispose();

        this.activeScene = this.scenes.get(name);
        this.activeScene?.init?.(param, event)
    }
}
