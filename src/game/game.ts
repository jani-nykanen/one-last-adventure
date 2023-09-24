import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Canvas, Flip, TransformTarget } from "../gfx/interface.js";
import { Sprite } from "../gfx/sprite.js";
import { GameObjectManager } from "./gameobjectmanager.js";
import { Stage } from "./stage.js";
import { Camera } from "./camera.js";
import { BackgroundType } from "./background.js";
import { ProgressManager } from "./progress.js";
import { TransitionType } from "../core/transition.js";
import { RGBA } from "../math/rgba.js";


export class Game implements Scene {


    private playerSprite : Sprite

    private objects : GameObjectManager | undefined = undefined;
    private stage : Stage | undefined = undefined;
    private camera : Camera | undefined = undefined;

    private progress : ProgressManager;


    constructor() {

        this.progress = new ProgressManager();
    }


    private reset(event : ProgramEvent) : void {

        this.stage.reset();
        this.objects.reset();
        this.objects.centerCameraToPlayer(this.camera);
        this.stage.cameraCheck(this.camera, this.objects);

        // To make certain objects appear on the screen
        // this.objects.update(this.camera, this.stage, event);
    }


    private drawHUD(canvas : Canvas) : void {

        const bmp = canvas.getBitmap("hud");
        const bmpFont = canvas.getBitmap("font_outlines");

        const health = this.objects.getPlayerHealth();
        const maxHealth = this.objects.getPlayerMaxHealth();
        const coins = this.progress.getProperty("coins", 0);

        let dx : number;

        canvas.setColor();

        // Health
        const healthStr = String(health) + "/" + String(maxHealth);

        canvas.drawBitmap(bmp, Flip.None, -1, -2, 0, 0, 16, 16);
        canvas.drawText(bmpFont, healthStr, 12, -1, -7);

        // Coins
        const coinStr = "*" + String(coins); 

        dx = canvas.width - ((coinStr.length)*11 + 12) - 2;
        canvas.drawText(bmpFont, coinStr, dx + 12, -1, -7);

        canvas.drawBitmap(bmp, Flip.None, dx + 3, -1, 32, 0, 16, 16);
    }


    public init(param : SceneParameter, event : ProgramEvent) : void {

        // this.progress = new ProgressManager();

        this.playerSprite = new Sprite(16, 16);

        this.camera = new Camera(event.screenWidth, event.screenHeight, 0, 0);

        this.objects = new GameObjectManager(this.progress, event);
        this.stage = new Stage("void", BackgroundType.Void, event);
        this.stage.createInitialObjects(this.objects);
        this.objects.centerCameraToPlayer(this.camera);

        this.stage.cameraCheck(this.camera, this.objects);
    }


    public update(event : ProgramEvent) : void {
        
        if (event.transition.isActive())
            return;

        this.playerSprite.animate(0, 1, 6, 8, event.tick);

        this.objects?.update(this.camera, this.stage, event);
        this.camera?.update(event);
        this.stage?.update(this.camera, event);

        if (this.objects?.hasPlayerDied()) {

            event.transition.activate(true, TransitionType.Fade, 1.0/30.0, 
                (event : ProgramEvent) => this.reset(event), new RGBA(0, 0, 0));
        }
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

        this.drawHUD(canvas);
    }


    public dispose() : SceneParameter {

        return undefined;
    }

}
