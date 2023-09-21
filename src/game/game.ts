import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Canvas, Flip, TransformTarget } from "../gfx/interface.js";
import { Sprite } from "../gfx/sprite.js";
import { GameObjectManager } from "./gameobjectmanager.js";
import { Stage } from "./stage.js";
import { Camera } from "./camera.js";
import { BackgroundType } from "./background.js";


export class Game implements Scene {


    private playerSprite : Sprite

    private objects : GameObjectManager | undefined = undefined;
    private stage : Stage | undefined = undefined;
    private camera : Camera | undefined = undefined;


    public init(param : SceneParameter, event : ProgramEvent) : void {

        this.playerSprite = new Sprite(16, 16);

        this.objects = new GameObjectManager(event);
        this.stage = new Stage("void", BackgroundType.Void, event);
        this.stage.createInitialObjects(this.objects);

        this.camera = new Camera(event.screenWidth, event.screenHeight, 0, 0);

        this.stage.cameraCheck(this.camera, this.objects);
    }


    public update(event : ProgramEvent) : void {
        
        this.playerSprite.animate(0, 1, 6, 8, event.tick);

        this.objects?.update(this.camera, this.stage, event);
        this.camera?.update(event);
        this.stage?.update(this.camera, event);
    }


    public redraw(canvas : Canvas) : void {

        canvas.setColor();
        
        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.view(canvas.width, canvas.height);

        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();
        canvas.applyTransform();
        
        this.stage?.drawBackground(canvas, this.camera);

        this.camera.use(canvas);

        this.stage?.draw(canvas, this.camera);
        this.objects?.draw(canvas);

        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.view(canvas.width, canvas.height);
        canvas.applyTransform();

        this.stage?.drawForeground(canvas);

        canvas.setColor(0, 0, 0);
        canvas.drawText(canvas.getBitmap("font"), "Alpha 0.0.1", 2, 2, -1, 0);

    }


    public dispose() : SceneParameter {

        return undefined;
    }

}
