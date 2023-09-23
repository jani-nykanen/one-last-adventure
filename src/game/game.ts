import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Canvas, Flip, TransformTarget } from "../gfx/interface.js";
import { Sprite } from "../gfx/sprite.js";
import { GameObjectManager } from "./gameobjectmanager.js";
import { Stage } from "./stage.js";
import { Camera } from "./camera.js";
import { BackgroundType } from "./background.js";
import { ProgressManager } from "./progress.js";


export class Game implements Scene {


    private playerSprite : Sprite

    private objects : GameObjectManager | undefined = undefined;
    private stage : Stage | undefined = undefined;
    private camera : Camera | undefined = undefined;

    private progress : ProgressManager;


    constructor() {

        this.progress = new ProgressManager();
    }


    private drawHUD(canvas : Canvas) : void {

        const bmp = canvas.getBitmap("hud");
        const bmpFont = canvas.getBitmap("font_outlines");

        const health = this.objects.getPlayerHealth();
        const maxHealth = this.objects.getPlayerMaxHealth();
        const coins = this.progress.getProperty("coins", 0);

        const fracHealth = (health/2) | 0;

        let sx : number;
        let dx : number;

        canvas.setColor();

        // Health
        for (let i = 0; i < maxHealth/2; ++ i) {

            dx = -2 + i*11;

            sx = fracHealth > i ? 0 : 16;
            canvas.drawBitmap(bmp, Flip.None, dx, -2, sx, 0, 16, 16);
            if (health - i*2 == 1) {

                canvas.drawBitmap(bmp, Flip.None, dx, -2, 0, 0, 8, 16);
            }
        }

        // Coins
        const coinStr = "*" + String(coins); 

        dx = canvas.width - ((coinStr.length)*11 + 12) - 2;
        canvas.drawText(bmpFont, coinStr, dx + 12, -1, -7);

        canvas.drawBitmap(bmp, Flip.None, dx + 3, -1, 32, 0, 16, 16);
    }


    public init(param : SceneParameter, event : ProgramEvent) : void {

        // this.progress = new ProgressManager();

        this.playerSprite = new Sprite(16, 16);

        this.objects = new GameObjectManager(this.progress, event);
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

        this.drawHUD(canvas);
    }


    public dispose() : SceneParameter {

        return undefined;
    }

}
