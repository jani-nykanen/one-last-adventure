import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Canvas, Flip, TransformTarget } from "../gfx/interface.js";
import { GameObjectManager } from "./gameobjectmanager.js";
import { Stage } from "./stage.js";
import { Camera } from "./camera.js";
import { ProgressManager } from "./progress.js";
import { TransitionType } from "../core/transition.js";
import { RGBA } from "../math/rgba.js";
import { PauseMenu } from "./pause.js";
import { InputState } from "../core/inputstate.js";
import { LOCAL_STORAGE_MAP_KEY, LOCAL_STORAGE_SAVE_KEY } from "./savekey.js";
import { TextBox } from "../ui/textbox.js";
import { MusicVolume } from "./musicvolume.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";
import { Story } from "./story.js";
import { getMapName } from "./mapnames.js";
import { Shop } from "./shop.js";
import { updateSpeedAxis } from "./utility.js";
import { GameMap, MapArea } from "./map.js";


export class Game implements Scene {


    private objects : GameObjectManager | undefined = undefined;
    private stage : Stage | undefined = undefined;
    private camera : Camera | undefined = undefined;
    private map : GameMap | undefined = undefined;

    private pause : PauseMenu | undefined = undefined;

    private progress : ProgressManager | undefined = undefined;
    private genericTextbox : TextBox | undefined = undefined;
    private shop : Shop | undefined = undefined;

    private story : Story;

    private stageIndex : number = 0;

    private oldMagic : number = 0;


    constructor() {

        this.story = new Story();
    }


    private playMusic(event : ProgramEvent) : void {

        const name = getMapName(this.stageIndex);

        event.audio.fadeInMusic(event.assets.getSample("theme_" + String(name)), MusicVolume[name], 1000);
    }


    private reset(event : ProgramEvent, newStage : boolean = false) : void {
        
        this.objects.togglePlayerRelocation(newStage);
        if (!newStage) {

            this.stage.reset();
        }

        this.objects.reset();
        this.stage.createInitialObjects(this.objects);
        this.objects.centerCameraToPlayer(this.camera);
        this.stage.cameraCheck(this.camera, this.objects, event);

        this.objects.initialCameraCheck(this.camera, event);
        this.objects.initialActivableObjectCheck(this.camera, event);

        // To make certain objects appear on the screen
        // this.objects.update(this.camera, this.stage, event);

        event.transition.setCenter(this.objects.getRelativePlayerPosition(this.camera));

        this.playMusic(event);

        this.oldMagic = this.objects.getPlayerMagic() ?? 3.0;
    }


    private setMapArea() : void {

        let area = MapArea.Uncharted;
        if (this.stageIndex == 1)
            area = MapArea.Island;
        else if (this.stageIndex == 2)
            area = MapArea.Caves;

        this.map?.setArea(area);
    }


    private changeMap(index : number, event : ProgramEvent, recreatePlayer : boolean = true) : void {

        this.stageIndex = index;

        this.progress.setProperty("area", index);

        // TODO: Recreate stage with a bit more memory-friendly way?
        this.stage = new Stage(index, event);

        const oldHealth = this.objects?.getPlayerHealth() ?? 1;

        this.reset(event, recreatePlayer);
        this.setMapArea();

        this.objects?.setPlayerHealth(oldHealth);
    }


    private drawMagicBar(canvas : Canvas, cannotUse : boolean,
        t : number, dx : number, dy : number, dw : number, dh : number) : void {

        // Backround
        canvas.setColor(0, 0, 0);
        canvas.fillRect(dx, dy, dw, dh);
        canvas.setColor(73, 73, 73);
        canvas.fillRect(dx + 1, dy + 1, dw - 2, dh - 2);
        canvas.setColor(146, 146, 146);
        canvas.fillRect(dx + 1, dy + 1, dw - 3, dh - 3);

        // Actual bar
        const w = (t*(dw - 2)) | 0;

        if (cannotUse) {
            
            canvas.setColor(146, 0, 109);
        }
        else {

            canvas.setColor(219, 36, 182);
        }
        canvas.fillRect(dx + 1, dy + 1, w, dh - 2);

        if (w > 1) {

            if (cannotUse) {

                canvas.setColor(219, 36, 182);
            }
            else {

                canvas.setColor(255, 146, 255);
            }

            canvas.fillRect(dx + 1, dy +1, w - 1, dh - 3);
        }

        canvas.setColor();
    }

    

    private drawHUD(canvas : Canvas) : void {

        const MAGIC_BAR_WIDTH_FACTOR = 9;

        const bmp = canvas.getBitmap("hud");
        const bmpFont = canvas.getBitmap("font_outlines");

        const health = this.objects.getPlayerHealth();
        const maxHealth = this.objects.getPlayerMaxHealth();
        const coins = this.progress.getProperty("coins", 0);
        const gems = this.progress.getProperty("gems", 0);

        const magic = this.objects.getPlayerMagic();
        const maxMagic = this.objects.getPlayerMaxMagic();

        let dx : number;

        canvas.setColor();

        // Health
        const healthStr = String(health) + "/" + String(maxHealth);

        canvas.drawBitmap(bmp, Flip.None, -1, -2, 0, 0, 16, 16);
        canvas.drawText(bmpFont, healthStr, 12, -1, -7);

        // Magic
        let t : number;
        if (magic !== undefined) {

            canvas.drawBitmap(bmp, Flip.None, -1, canvas.height - 15, 48, 0, 16, 16);
        
            t = this.oldMagic / maxMagic;
            this.drawMagicBar(canvas, magic < 1.0, this.oldMagic/maxMagic,
                14, canvas.height - 10, maxMagic*MAGIC_BAR_WIDTH_FACTOR, 8);
        }

        // Coins
        const coinStr = "*" + String(coins); 

        dx = canvas.width - ((coinStr.length)*11 + 12) - 2;
        canvas.drawText(bmpFont, coinStr, dx + 12, -1, -7);

        canvas.drawBitmap(bmp, Flip.None, dx + 3, -1, 32, 0, 16, 16);

        if (gems <= 0)
            return;

        const gemStr = "*" + String(gems); 

        dx = canvas.width - ((gemStr.length)*11 + 12) - 2;
        canvas.drawText(bmpFont, gemStr, dx + 12, canvas.height - 14, -7);

        canvas.drawBitmap(bmp, Flip.None, dx + 3, canvas.height - 14, 64, 0, 16, 16);
    }


    private createInitialPlayer() : void {

        const cx = this.progress.getProperty("checkpointx", -1);
        const cy = this.progress.getProperty("checkpointy", -1)

        if (cx != -1 && cy != -1) {

            this.objects.addPlayer((cx/TILE_WIDTH) | 0, (cy/TILE_HEIGHT) | 0);
        }
    } 


    private updateHUD(event : ProgramEvent) : void {

        const BAR_UPDATE_SPEED : number = 1.0/10.0;

        this.oldMagic = updateSpeedAxis(this.oldMagic, this.objects.getPlayerMagic() ?? 3.0, BAR_UPDATE_SPEED*event.tick);
    }


    private teleport(x : number, y : number, id : number, event : ProgramEvent) : void {

        const newPos = this.stage.findTeleporter(id, x, y);

        event.transition.deactivate();

        this.objects.setPlayerFrame(3, 2);
        this.objects.setPlayerPosition(newPos.x, newPos.y, true);
        this.objects.centerCameraToPlayer(this.camera);
        
        this.stage.cameraCheck(this.camera, this.objects, event);
        this.objects.initialCameraCheck(this.camera, event);
        this.objects.initialActivableObjectCheck(this.camera, event);

        event.transition.activate(false, TransitionType.Waves, 1.0/120.0, event, 
            undefined, new RGBA(255, 255, 255));

        event.audio.resumeMusic();
    }


    private createMap(event : ProgramEvent) : void {

        const baseMap = event.assets.getTilemap("island");
        if (baseMap === undefined) {

            console.warn("Missing the island tilemap, could not create a game map!");
            return;
        }

        const roomWidth = (event.screenWidth/TILE_WIDTH) | 0;
        const roomHeight = (event.screenHeight/TILE_HEIGHT) | 0

        const width = baseMap.width/roomWidth;
        const height = baseMap.height/roomHeight;

        this.map = new GameMap(width, height, roomWidth, roomHeight);
    }


    private save() : boolean {

        return this.progress.saveToLocalStorage(LOCAL_STORAGE_SAVE_KEY) &&
               this.map.save(LOCAL_STORAGE_MAP_KEY);
    }


    public init(param : SceneParameter, event : ProgramEvent) : void {

        this.progress = new ProgressManager();
        this.genericTextbox = new TextBox(true, 27, 5);
        this.shop = new Shop(this.progress, this.genericTextbox, event);

        this.story = new Story();
        this.stageIndex = 0;

        this.createMap(event);

        if (param === 1) {

            this.progress.loadFromLocalStorage(LOCAL_STORAGE_SAVE_KEY);
            this.map.load(LOCAL_STORAGE_MAP_KEY);

            this.stageIndex = this.progress.getProperty("area");
            this.playMusic(event);
        }
        else {

            event.transition.activate(false, TransitionType.Fade, 1.0/30.0, event);
            this.story.activate(true, event);
        }

        this.camera = new Camera(event.screenWidth, event.screenHeight, 0, 0);

        this.objects = new GameObjectManager(
            this.progress, this.genericTextbox, this.shop,
            () => this.pause.activate(true),
            (event : ProgramEvent) => {

                event.transition.deactivate();
                this.changeMap(1, event);
                this.objects.setPlayerFrame(3, 2);
                event.transition.activate(false, TransitionType.Waves, 1.0/120.0, event, 
                    undefined, new RGBA(255, 255, 255));
            },
            (event : ProgramEvent) => {
                
                this.stageIndex = this.stageIndex == 1 ? 2 : 1;
                this.changeMap(this.stageIndex, event, false);

                this.objects.setPlayerFrame(3, 2);
            },
            (event : ProgramEvent) => {

                this.stage.togglePurpleBlocks(this.camera);
            },
            (x : number, y : number, id : number, event : ProgramEvent) => this.teleport(x, y, id, event),
            (amount : number, time : number) => this.camera.shake(amount, time)
            );
        if (param === 1) {

            this.createInitialPlayer();
        }

        this.stage = new Stage(this.stageIndex, event);
        this.stage.createInitialObjects(this.objects);
        this.objects.centerCameraToPlayer(this.camera);

        this.stage.cameraCheck(this.camera, this.objects, event);
        this.objects.initialActivableObjectCheck(this.camera, event);

        this.pause = new PauseMenu(event, 
            (event : ProgramEvent) => this.objects.killPlayer(event),
            () => this.save(),
            (event : ProgramEvent) => event.scenes.changeScene("titlescreen", event),
            (event : ProgramEvent) => {

                if (!event.audio.resumeMusic()) {

                    this.playMusic(event);
                }
            });

        if (param === 1) {

            event.transition.activate(false, 
                TransitionType.Circle, 1.0/30.0, event,
                undefined, new RGBA(0, 0, 0),
                this.objects.getRelativePlayerPosition(this.camera));
        }

        this.oldMagic = this.objects.getPlayerMaxMagic();

        this.setMapArea();
    }


    public update(event : ProgramEvent) : void {
        
        if (event.transition.isActive())
            return;

        if (!this.story.isPlayed()) {

            this.story.update(event);
            return;
        }

        if (this.shop.isActive()) {

            this.shop.update(event);
            return;
        }

        if (this.genericTextbox.isActive()) {

            this.genericTextbox.update(event);
            return;
        }

        if (this.pause.isActive()) {

            this.pause.update(event);
            return;
        }

        if (event.input.getAction("pause") == InputState.Pressed) {

            event.audio.playSample(event.assets.getSample("pause"), 0.40);

            event.audio.pauseMusic();
            this.pause.activate();
            return;
        }

        this.map?.update(this.camera, event);
        if (this.map?.isActive()) {

            if (event.input.isAnyPressed()) {

                this.map?.deactivate();
                event.audio.playSample(event.assets.getSample("select"), 0.55);
            }
            return;
        }

        if (event.input.getAction("map") == InputState.Pressed) {

            if (this.progress.getProperty("item8") == 0) {

                event.audio.playSample(event.assets.getSample("reject"), 0.50);
            }
            else {
            
                event.audio.playSample(event.assets.getSample("pause"), 0.40);
                this.map?.activate();
                return;
            }
        }

        this.updateHUD(event);

        this.objects?.update(this.camera, this.stage, event);
        this.camera?.update(event);
        this.stage?.update(this.camera, event);

        if (this.objects?.hasPlayerDied()) {

            event.transition.activate(true, TransitionType.Circle, 1.0/45.0, event,
                (event : ProgramEvent) => this.reset(event), new RGBA(0, 0, 0),
                this.objects.getRelativePlayerPosition(this.camera));
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

        this.objects.postDraw(canvas);

        this.drawHUD(canvas);

        if (!this.story.isPlayed()) {

            this.story.draw(canvas, this.objects.getRelativePlayerPosition(this.camera));
            return;
        }

        this.shop?.draw(canvas);
        this.genericTextbox?.draw(canvas, 0, canvas.height/2 - (this.genericTextbox.getHeight() + 1)/2*12);
        this.pause?.draw(canvas);
        this.map?.draw(canvas, this.objects.getPlayerPosition());
    }


    public dispose() : SceneParameter {

        this.objects = undefined;
        this.stage = undefined;
        this.camera = undefined;
        this.pause = undefined;
        this.genericTextbox = undefined;
        this.progress = undefined;

        return undefined;
    }

}
