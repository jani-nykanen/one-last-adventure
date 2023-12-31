import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { Camera } from "./camera.js";
import { CollisionObject } from "./collisionobject.js";
import { GameObjectManager } from "./gameobjectmanager.js";
import { MapLayer } from "./maplayer.js";
import { Background, BackgroundType } from "./background.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";
import { getMapName } from "./mapnames.js";
import { Vector } from "../math/vector.js";
import { ChestType } from "./chest.js";
import { GameMap, MapMarker } from "./map.js";
import { ProgressManager } from "./progress.js";


const CREATABLE_OBJECTS = [2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 49, 50, 53];
const OBJECT_LAYER_START = 256;


const getBackgroundType = (id : number) : BackgroundType =>
    [BackgroundType.Void, BackgroundType.IslandDay, BackgroundType.Caves, BackgroundType.Castle][id] ?? BackgroundType.Unknown;


export class Stage {


    private mapLayer : MapLayer;
    private objectLayer : number[] | undefined;
    private objectCreationWaiting : boolean[];

    private background : Background;

    private index : number; // Unused?
    private mapName : string;
    
    public readonly width : number;
    public readonly height : number;


    constructor(index : number, event : ProgramEvent) {

        const mapName = getMapName(index);

        const baseMap = event.assets.getTilemap(mapName);
        const baseCollision = event.assets.getTilemap("collisions_" + mapName);

        if (baseMap === undefined || baseCollision === undefined) {

            throw new Error("Missing tilemap and/or collision layer: " + mapName + "!");
        }

        this.mapLayer = new MapLayer(baseMap, baseCollision, event);

        this.width = baseMap.width;
        this.height = baseMap.height;

        this.objectLayer = baseMap.cloneLayer("objects");
        this.objectCreationWaiting = this.computeCreationWaitingArray();

        this.background = new Background(getBackgroundType(index), event);

        this.mapName = mapName;
    }


    private computeCreationWaitingArray() : Array<boolean> {

        return this.objectLayer.map( (v : number) : boolean => {
            
            const i = v - OBJECT_LAYER_START;
            return (CREATABLE_OBJECTS.includes(i) || (i >= 17 && i <= 48));
        });
    }


    private createObject(tileID : number, x : number, y : number, 
        objects : GameObjectManager, event : ProgramEvent) : void {

        // console.log("Created object with index: " + tileID);

        const modifier = y == 0 ? -1 : (this.objectLayer[(y - 1)*this.width + x] - 368);

        let crateID : number;

        switch (tileID) {

        // Player
        case 1:

            objects.addPlayer(x, y);
            break;

        // Crate
        case 8:
        case 11:
        case 2:

            crateID = 0;
            if (tileID == 8)
                crateID = 1;
            else if (tileID == 11)
                crateID = 2;

            objects.addCrate(x, y, y*this.width + x, crateID);
            break;

        // Hint
        case 5:
            objects.addHint(x, y, modifier, event);
            break;

        // Savepoint
        case 6:

            objects.addSavepoint(x, y);
            break;

        // NPC
        case 7:

            objects.addNPC(x, y, modifier);
            break;

        // Door
        case 14:
        case 9:

            objects.addDoor(x, y, tileID == 14);
            break;

        // Shopkeeper
        case 10:

            objects.addShopkeeper(x, y);
            break;

        // Fan
        case 12:

            objects.addFan(x, y, y*this.width + x);
            break;

        // Switch
        case 13:

            objects.addSwitch(x, y, modifier);
            break;

        // Teleporter
        case 15:

            objects.addTeleport(x, y, modifier);
            break;

        // Chest
        case 3:

            objects.addChest(x, y, ChestType.Item, modifier);
            break;

        // Gem chest
        case 16:

            objects.addChest(x, y, ChestType.Gem, modifier);
            break;

        // Life & magic chest
        case 49:
        case 50:

            objects.addChest(x, y, ChestType.Life + (tileID - 49), modifier);
            break;

        // Boss chest
        case 53:

            objects.addChest(x, y, ChestType.Boss, modifier);
            break;

        default:

            if (tileID >= 17 && tileID <= 48) {

                objects.addEnemy(x, y, y*this.width + x, tileID - 16);
            }
            break;
        }
    }


    private removePurpleSwitches(camera : Camera) : void {

        const camPos = camera.getTopCorner();

        const startx = Math.round(camPos.x/TILE_WIDTH);
        const starty = Math.round(camPos.y/TILE_HEIGHT);

        const endx = startx + Math.round(camera.width/TILE_WIDTH);
        const endy = starty + Math.round(camera.height/TILE_HEIGHT);

        let objID : number;

        for (let y = starty; y < endy; ++ y) {

            for (let x = startx; x < endx; ++ x) {

                objID = this.objectLayer[y*this.width + x] ?? -1;
                if (objID == 256 + 11) {

                    this.objectLayer[y*this.width + x] = 0;
                }
            }
        }
        
    }


    public update(camera : Camera, event : ProgramEvent) : void {

        this.background.update(camera, event);
    }


    public draw(canvas : Canvas, camera : Camera | undefined) : void {

        const bmp = canvas.getBitmap("tileset_" + this.mapName);

        this.mapLayer.draw(canvas, bmp, camera);
    }


    public drawBackground(canvas : Canvas, camera : Camera | undefined) : void {

        const cpos = camera.getTopCorner();

        const shiftx = -Math.round(cpos.x / 16);
        const shifty = -Math.round(cpos.y / 16);

        this.background.draw(canvas, shiftx, shifty);
    }


    public drawForeground(canvas : Canvas) : void {

        this.background.drawForegorund(canvas);
    }


    public objectCollision(o : CollisionObject, event : ProgramEvent) : void {

        if (!o.isActive())
            return;

        this.mapLayer.objectCollision(o, event);
    }


    public cameraCheck(camera : Camera, objects : GameObjectManager, event : ProgramEvent) : void {

        const MARGIN = 2;

        const camPos = camera?.getTopCorner();

        const startx = Math.max(0, Math.round(camPos.x/TILE_WIDTH) - MARGIN);
        const starty = Math.max(0, Math.round(camPos.y/TILE_HEIGHT) - MARGIN);

        const endx = Math.min(this.width, startx + Math.round(camera.width/TILE_WIDTH) + MARGIN*2);
        const endy = Math.min(this.height, starty + Math.round(camera.height/TILE_HEIGHT) + MARGIN*2);

        let index : number;

        for (let y = starty; y < endy; ++ y) {

            for (let x = startx; x < endx; ++ x) {

                index = y*this.width + x;

                if (!this.objectCreationWaiting[index]) 
                    continue;

                this.createObject(this.objectLayer[index] - OBJECT_LAYER_START, x, y, objects, event);
                this.objectCreationWaiting[index] = false;
            }
        }
    }


    public createInitialObjects(objects : GameObjectManager, exitCastle : boolean = false) : void {

        if (this.objectLayer === undefined)
            return;

        let tileID : number;
        let modifier : number;

        for (let y = 0; y < this.mapLayer.height; ++ y) {

            for (let x = 0; x < this.mapLayer.width; ++ x) {

                tileID = this.objectLayer[y*this.width + x];
                if (tileID <= OBJECT_LAYER_START)
                    continue;

                modifier = y == 0 ? -1 : (this.objectLayer[(y - 1)*this.width + x] - 368);;

                tileID -= OBJECT_LAYER_START;

                switch (tileID) {

                // Player
                case 1:

                    if (!exitCastle) {

                        objects.addPlayer(x, y);
                    }
                    break;

                // Portal
                case 4:

                    objects.addPortal(x, y);
                    break;

                // Giant door
                case 51:

                    objects.addGiantDoor(x, y);
                    if (exitCastle) {

                        objects.addPlayer(x, y, true);
                    }
                    break;

                // Special player spawn
                case 52:

                    objects.addPlayer(x, y, true);
                    objects.addGiantDoor(x, y, true);
                    break;

                default:
                    break;
                }
            }
        }
    }


    public setMapMarkers(map : GameMap, progress : ProgressManager) : void {

        if (this.objectLayer === undefined)
            return;

        let tileID : number;
        let modifier : number;

        for (let y = 0; y < this.mapLayer.height; ++ y) {

            for (let x = 0; x < this.mapLayer.width; ++ x) {

                tileID = this.objectLayer[y*this.width + x];
                if (tileID <= OBJECT_LAYER_START)
                    continue;

                modifier = y == 0 ? -1 : (this.objectLayer[(y - 1)*this.width + x] - 368);;

                tileID -= OBJECT_LAYER_START;

                switch (tileID) {

                // Chest (map marker only)
                case 3:

                    if (progress.getProperty("item" + String(modifier)) == 0) {

                        map.putSpecialMarker(x, y, MapMarker.Chest);
                    }
                    break;

                // Health chest (map marker only)
                case 49:

                    if (progress.getProperty("life" + String(modifier)) == 0) {

                        map.putSpecialMarker(x, y, MapMarker.Chest);
                    }
                    break;

                // Magic chest (map marker only)
                case 50:

                    if (progress.getProperty("magic" + String(modifier)) == 0) {

                        map.putSpecialMarker(x, y, MapMarker.Chest);
                    }
                    break;

                // Gem chest (map marker only)
                case 16:

                    if (progress.getProperty("gem" + String(modifier)) == 0) {

                        map.putSpecialMarker(x, y, MapMarker.Chest);
                    }
                    break;

                // Teleporter (map marker only)
                case 15:

                    map.putSpecialMarker(x, y, MapMarker.Teleporter);
                    break;

                // Giant door
                case 51:

                    map.putSpecialMarker(x, y, MapMarker.BossDoor);
                    break;

                default:
                    break;
                }
            }
        }
    }


    public remarkCreatableObject(index : number) : void {

        this.objectCreationWaiting[index] = true;
    }


    public reset() : void {

        this.objectCreationWaiting = this.computeCreationWaitingArray();
        this.background.restore();
    }


    public togglePurpleBlocks(camera : Camera) : void {

        this.mapLayer.togglePurpleBlocks(camera);
    
        // Also remove the "block switches" to avoid deadlock
        // situations
        this.removePurpleSwitches(camera);
    }


    public findTeleporter(id : number, startx : number, starty : number) : Vector {

        let mod : number;
        let tileID : number;

        let i : number;

        for (let y = 1; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                if (x == startx && y == starty)
                    continue;

                i = y*this.width + x;
                tileID = this.objectLayer[i]
                if (tileID == 271) {

                    mod = this.objectLayer[i - this.width] - 368;
                    if (mod == id) {

                        return new Vector(x, y);
                    }
                }
            }
        }

        return new Vector(startx, starty);
    }


    public changeBackground(newType : BackgroundType) : void {

        this.background.changeType(newType);
    }
}
