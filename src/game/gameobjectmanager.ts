import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { Camera } from "./camera.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";
import { Crate } from "./crate.js";
import { ParticleGenerator } from "./particlegenerator.js";
import { CollectibleGenerator } from "./collectiblegenerator.js";
import { ProgressManager } from "./progress.js";
import { FlyingMessageGenerator } from "./flyingmessagegenerator.js";
import { Enemy } from "./enemies/enemy.js";
import { getEnemyType } from "./enemies/enemytype.js";
import { Vector } from "../math/vector.js";
import { Chest, ChestType } from "./chest.js";
import { ActivableObject } from "./activableobject.js";
import { TextBox } from "../ui/textbox.js";
import { Portal } from "./portal.js";
import { Hint } from "./hint.js";
import { SavePoint } from "./savepoint.js";
import { NPC } from "./npc.js";
import { Door } from "./door.js";
import { Shopkeeper } from "./shopkeeper.js";
import { Shop } from "./shop.js";
import { ProjectileGenerator } from "./projectilegenerator.js";
import { Fan } from "./fan.js";
import { Switch } from "./switch.js";
import { GiantDoor } from "./giantdoor.js";
import { Teleporter } from "./teleporter.js";


export class GameObjectManager {
    
    
    private player : Player | undefined = undefined;
    private crates : Crate[];
    private enemies : Enemy[];
    private fans : Fan[];
    private hints : Hint[];

    private activableObjects : ActivableObject[];

    private overridingHint : Hint | undefined = undefined;

    private particles : ParticleGenerator;
    private collectibles : CollectibleGenerator;
    private flyingMessages : FlyingMessageGenerator;
    private projectiles : ProjectileGenerator;

    private saveDialogueCallback : ((event : ProgramEvent) => void) | undefined = undefined;
    private initialPortalCallback : ((event : ProgramEvent) => void) | undefined = undefined;
    private doorCallback : ((event : ProgramEvent) => void) | undefined = undefined;
    private purpleBlockCallback : ((event : ProgramEvent) => void) | undefined = undefined;
    private teleporterCallback : ((x : number, y : number, id : number, event : ProgramEvent) => void) | undefined = undefined;
    private shakeCallback : ((amount : number, time : number) => void) | undefined = undefined;

    private relocatePlayer : boolean = false;

    private readonly progress : ProgressManager;
    private readonly textbox : TextBox;
    private readonly shop : Shop;


    constructor(progress : ProgressManager, 
        textbox : TextBox, shop : Shop,
        saveDialogueCallback? : (event : ProgramEvent) => void,
        initialPortalCallback? : (event : ProgramEvent) => void,
        doorCallback? : (event : ProgramEvent) => void,
        purpleBlockCallback? : (event : ProgramEvent) => void,
        teleporterCallback?  : (x : number, y : number, id : number, event : ProgramEvent) => void,
        shakeCallback? : (amount : number, time : number) => void) {

        this.crates = new Array<Crate> ();
        this.enemies = new Array<Enemy> ();
        this.fans = new Array<Fan> ();
        this.hints = new Array<Hint> ();

        this.activableObjects = new Array<ActivableObject> ();

        this.particles = new ParticleGenerator();
        this.collectibles = new CollectibleGenerator();
        this.flyingMessages = new FlyingMessageGenerator();
        this.projectiles = new ProjectileGenerator();

        this.progress = progress;
        this.textbox = textbox;
        this.shop = shop;

        this.saveDialogueCallback = saveDialogueCallback;
        this.initialPortalCallback = initialPortalCallback;
        this.doorCallback = doorCallback;
        this.purpleBlockCallback = purpleBlockCallback;
        this.teleporterCallback = teleporterCallback;
        this.shakeCallback = shakeCallback;
    }


    private createItemHint(x : number, y : number, id : number, event : ProgramEvent) : void {

        const text = event.localization?.getItem("item_hints")?.[id - 1] ?? "";

        if (text.length == 0)
            return;

        this.overridingHint = new Hint(x, y, text, true);
    }


    private movingCameraCheck(camera : Camera, stage : Stage, event : ProgramEvent) : void {

        stage.cameraCheck(camera, this, event);
        this.player?.cameraCollision(camera, event);

        for (let c of this.crates) {

            c.cameraCheck(camera, event);
        }

        for (let e of this.enemies) {

            e.cameraCheck(camera, event);
        }

        for (let o of this.activableObjects) {

            o.cameraCheck(camera, event);
        }

        for (let o of this.fans) {

            o.cameraCheck(camera, event);
        }

        for (let i = 0; i < this.hints.length; ++ i) {

            if (this.hints[i].isActivated()) {

                this.hints.splice(i, 1);
            }    
        }

        if (this.overridingHint?.isActivated()) {

            this.overridingHint = undefined;
        }

        this.projectiles.cameraCheck(camera, event);
    }


    private updateActivableObjects(camera : Camera, event : ProgramEvent) : void {

        let o : ActivableObject;

        for (let i = 0; i < this.activableObjects.length; ++ i) {

            o = this.activableObjects[i];

            o.cameraCheck(camera, event);
            if (!o.isInCamera())
                continue;

            o.update(event);
            o.playerCollision(this.player, camera, event);

            if (!o.doesExist()) {

                this.activableObjects.splice(i, 1);
                continue;
            }
        }
    }


    private updateCrates(camera : Camera, stage : Stage, event : ProgramEvent) : void {

        let c1 : Crate;
        let c2 : Crate;

        for (let i = 0; i < this.crates.length; ++ i) {

            c1 = this.crates[i];

            c1.cameraCheck(camera, event);
            if (!c1.isInCamera()) {

                stage.remarkCreatableObject(c1.stageTileIndex);
                this.crates.splice(i, 1);
                continue;
            }

            if (!c1.isActive())
                continue;

            c1.update(event);

            stage.objectCollision(c1, event);

            for (let j = i; j < this.crates.length; ++ j) {

                c2 = this.crates[j];
                c2.collisionObjectCollision(c1, this.player, event);
            }

            if (this.player !== undefined) {

                c1.collisionObjectCollision(this.player, this.player, event);
                c1.playerCollision(this.player, event);

                if (!c1.doesExist()) {

                    this.crates.splice(i, 1);
                    continue;
                }
            }
        }
    }


    private updateEnemies(camera : Camera, stage : Stage, event : ProgramEvent) : void {

        let e1 : Enemy;
        let e2 : Enemy;

        for (let i = 0; i < this.enemies.length; ++ i) {

            e1 = this.enemies[i];
            if (!e1.doesExist())
                continue;

            e1.cameraCheck(camera, event);

            // TODO: Check if this is sufficient
            if (!e1.isInCamera() && !e1.isDying()) {

                stage.remarkCreatableObject(e1.stageTileIndex);
                this.enemies.splice(i, 1);
                
                continue;
            }
            
            if (!e1.isInCamera())
                continue;

            e1.update(event);
            e1.cameraCollision(camera, event);
            stage.objectCollision(e1, event);

            for (let j = i; j < this.enemies.length; ++ j) {

                e2 = this.enemies[j];
                e2.enemyToEnemyCollision(e1, event);
            }

            if (this.player !== undefined) {

                e1.playerCollision(this.player, event);
                if (!e1.doesExist()) {

                    this.enemies.splice(i, 1);
                    continue;
                }
            }

            for (let c of this.crates) {

                c.collisionObjectCollision(e1, this.player, event);
            }
        }

        this.projectiles.enemyCollision(this.enemies, this.player, event);
    }


    private updateFans(camera : Camera, stage : Stage, event : ProgramEvent) : void {

        let o : Fan;
 
        for (let i = 0; i < this.fans.length; ++ i) {

            o = this.fans[i];
            o.cameraCheck(camera, event);
            if (!o.isInCamera()) {

                stage.remarkCreatableObject(o.stageTileIndex);
                this.fans.splice(i, 1);
                continue;
            }

            if (!o.isActive())
                continue;

            o.update(event);
            if (this.player !== undefined) {

                o.playerCollision(this.player, event);
            }
        }
    }


    private updateHints(camera : Camera, event : ProgramEvent) : void {

        let h : Hint;
        for (let i = 0; i < this.hints.length; ++ i) {

            h = this.hints[i];

            h.cameraCheck(camera, event);
            h.update(event);
            if (h.isActive() && this.overridingHint !== undefined) {

                this.hints.splice(i);
            }
        }
        this.overridingHint?.update(event);
    }


    public update(camera : Camera | undefined, stage : Stage | undefined, event : ProgramEvent) : void {

        if (camera === undefined || stage === undefined)
            return;

        this.flyingMessages.update(event);

        if (camera?.isMoving()) {

            this.movingCameraCheck(camera, stage, event);
            return;
        }

        if (this.player?.isSpecialAnimationActive()) {

            this.player?.updateSpecialAnimation(event);
            return;
        }

        this.player?.update(event);
        this.player?.updateCollisionFlags();
        this.player?.cameraCollision(camera, event);
        stage?.objectCollision(this.player, event);

        this.updateCrates(camera, stage, event);
        this.updateEnemies(camera, stage, event);
        this.updateFans(camera, stage, event);

        this.particles.update(stage, camera, event);
        this.particles.crateCollision(this.crates, this.player, event);

        this.collectibles.update(stage, camera, this.player, event);
        this.collectibles.crateCollision(this.crates, this.player, event);

        this.projectiles.update(stage, camera, this.player, event);
        this.projectiles.crateCollision(this.crates, this.player, event);

        this.updateActivableObjects(camera, event);
        this.updateHints(camera, event);
    }


    public initialCameraCheck(camera : Camera, event : ProgramEvent) : void {

        for (let c of this.crates) {

            c.cameraCheck(camera, event);
        }

        for (let e of this.enemies) {

            e.cameraCheck(camera, event);
        }

        for (let o of this.activableObjects) {

            o.cameraCheck(camera, event);
        }
    }


    public initialActivableObjectCheck(camera : Camera, event : ProgramEvent) : void {

        if (this.player === undefined)
            return;

        for (let o of this.activableObjects) {

            o.playerCollision(this.player, camera, event, true);
        }
    }


    public draw(canvas : Canvas) : void {

        const bmpCrate = canvas.getBitmap("crate");
        const bmpEnemies = canvas.getBitmap("enemies_small");
        const bmpFan = canvas.getBitmap("fan");

        for (let o of this.fans) {

            o.draw(canvas, bmpFan);
        }

        for (let o of this.activableObjects) {

            o.draw?.(canvas);
        }

        for (let c of this.crates) {

            c.draw(canvas, bmpCrate);
        }
        this.particles.draw(canvas);

        for (let e of this.enemies) {

            e.draw(canvas, bmpEnemies);
        }

        this.collectibles.draw(canvas);

        this.player?.draw(canvas);
        this.projectiles.draw(canvas);
        this.player?.drawIcon(canvas);

        this.flyingMessages.draw(canvas);
    }


    public postDraw(canvas : Canvas) : void {

        if (this.textbox.isActive())
            return;

        for (let h of this.hints) {

            h.draw(canvas);
        }
        this.overridingHint?.draw(canvas);
    }


    public addPlayer(x : number, y : number) : void {

        if (this.player !== undefined) {

            if (this.relocatePlayer) {

                this.player?.respawn((x + 0.5)*TILE_WIDTH, (y + 0.5)*TILE_HEIGHT);
                this.relocatePlayer = false;
                return;
            }
            return;
        }

        this.player = new Player(
            (x + 0.5)*TILE_WIDTH, (y + 0.5)*TILE_HEIGHT, 
            this.progress, this.flyingMessages, this.projectiles);
    }


    public addCrate(x : number, y : number, stageIndex : number, id : number = 0) : void {

        this.crates.push(
            new Crate(
                (x + 0.5)*TILE_WIDTH, (y + 0.5)*TILE_HEIGHT, stageIndex,
                this.particles, this.collectibles, id, this.purpleBlockCallback));
    }


    public addEnemy(x : number, y : number, stageIndex : number, enemyTypeIndex : number) : void {

        const type = getEnemyType(enemyTypeIndex - 1);

        this.enemies.push(
            new type.prototype.constructor(
                (x + 0.5)*TILE_WIDTH, (y + 0.5)*TILE_HEIGHT, stageIndex,
                this.flyingMessages, this.collectibles, this.projectiles,
                this.shakeCallback));
    }


    public addChest(x : number, y : number, type : ChestType, id : number) : void {

        // TODO: Use a lookup array instead
        if ((type == ChestType.Item && this.progress.getProperty("item" + String(id), 0) != 0) ||
            (type == ChestType.Gem && this.progress.getProperty("gem" + String(id), 0) != 0) ||
            (type == ChestType.Life && this.progress.getProperty("life" + String(id), 0) != 0) ||
            (type == ChestType.Magic && this.progress.getProperty("magic" + String(id), 0) != 0) )
            return;

        this.activableObjects.push(
            new Chest(
                (x + 0.5)*TILE_WIDTH, 
                (y + 0.5)*TILE_HEIGHT, 
                id, type,
                this.textbox,
                (x : number, y : number, id : number, event : ProgramEvent) => this.createItemHint(x, y, id, event)));
    }


    public addPortal(x : number, y : number) : void {

        this.activableObjects.push(
            new Portal(
                (x + 0.5)*TILE_WIDTH, 
                (y + 0.5)*TILE_HEIGHT,
                this.initialPortalCallback));
    }


    public addDoor(x : number, y : number, locked : boolean = false) : void {

        locked &&= !(this.player?.progress.getProperty("door_unlocked") === 1);

        this.activableObjects.push(
            new Door(
                (x + 0.5)*TILE_WIDTH, 
                (y + 0.5)*TILE_HEIGHT,
                this.doorCallback,
                this.textbox,
                locked));
    }


    public addGiantDoor(x : number, y : number) : void {

        this.activableObjects.push(
            new GiantDoor(
                (x + 0.5)*TILE_WIDTH, 
                (y + 0.5)*TILE_HEIGHT,
                undefined, // TODO: Add callback
                this.textbox,
                this.progress,));
    }


    public addSavepoint(x : number, y : number) : void {

        this.activableObjects.push(
            new SavePoint(
                (x + 0.5)*TILE_WIDTH, 
                (y + 0.5)*TILE_HEIGHT,
                this.saveDialogueCallback));
    }


    public addNPC(x : number, y : number, id : number) : void {

        this.activableObjects.push(
            new NPC(
                (x + 0.5)*TILE_WIDTH, 
                (y + 0.5)*TILE_HEIGHT, 
                id, this.textbox));
    }


    public addShopkeeper(x : number, y : number) : void {

        this.activableObjects.push(
            new Shopkeeper(
                (x + 0.5)*TILE_WIDTH, 
                (y + 0.5)*TILE_HEIGHT, 
                this.shop));
    }


    public addFan(x : number, y : number, stageIndex : number) : void {

        this.fans.push(
            new Fan(
                (x + 0.5)*TILE_WIDTH, 
                (y + 0.5)*TILE_HEIGHT,
                stageIndex));
    }


    public addSwitch(x : number, y : number, id : number) : void {

        this.activableObjects.push(
            new Switch(
                (x + 0.5)*TILE_WIDTH, 
                (y + 0.5)*TILE_HEIGHT,
                id,
                this.textbox));
    }

    public addTeleport(x : number, y : number, id : number) : void {

        this.activableObjects.push(
            new Teleporter(
                (x + 0.5)*TILE_WIDTH, 
                (y + 0.5)*TILE_HEIGHT,
                x, y, id,
                this.teleporterCallback));
    }


    public addHint(x : number, y : number, id : number, event : ProgramEvent) : void {

        const hintStr = "hint" + String(id);

        if (this.progress.getProperty(hintStr) == 1) 
            return;

        const text = event.localization?.getItem("static_hints")?.[id - 1] ?? "";

        this.hints.push(new Hint(x*TILE_WIDTH, y*TILE_HEIGHT, text));

        this.progress.setProperty(hintStr, 1);
    }


    public reset() : void {

        if (!this.relocatePlayer) {

            this.player?.respawn();
        }

        this.crates = new Array<Crate> ();
        this.enemies = new Array<Enemy> ();
        this.fans = new Array<Fan> ();
        this.hints = new Array<Hint> ();

        this.overridingHint = undefined;

        // TODO: No need to recreate these, really
        this.activableObjects = new Array<ActivableObject> ();

        this.particles.clear();
        this.flyingMessages.clear();
        this.collectibles.clear();
        this.projectiles.clear();
    }


    public getPlayerHealth = () : number => this.player?.getHealth() ?? 0;
    public getPlayerMaxHealth = () : number => this.player?.getMaxHealth() ?? 0;

    
    public getPlayerMagic = () : number | undefined => this.player?.getMagicAmount();
    public getPlayerMaxMagic = () : number => this.player?.getMaxMagic() ?? 0;


    public hasPlayerDied() : boolean {

        return !this.player?.doesExist() ?? false;
    }


    public getRelativePlayerPosition = (camera : Camera) : Vector => {

        const o = this.player?.getPosition() ?? new Vector();

        return new Vector(o.x % camera.width, o.y % camera.height);
    }


    public getPlayerPosition = () : Vector => this.player?.getPosition().clone() ?? new Vector();


    public centerCameraToPlayer(camera : Camera) : void {

        if (this.player === undefined)
            return;

        camera.center(this.player);
    }


    public killPlayer(event : ProgramEvent) : void {

        this.player?.kill(event);
    }


    public togglePlayerRelocation(state : boolean) : void {

        this.relocatePlayer = state;
    }


    public setPlayerFrame(column : number, row : number) : void {

        this.player?.setFrame(column, row);
    }


    public setPlayerPosition(x : number, y : number, setCheckpoint : boolean = false) : void {

        this.player?.setPosition((x + 0.5)*TILE_WIDTH, (y + 0.5)*TILE_HEIGHT, setCheckpoint);
    }


    public setPlayerHealth = (amount : number) : void => this.player?.setHealth(amount);
}
