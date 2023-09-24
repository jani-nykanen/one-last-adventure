import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { Camera } from "./camera.js";
import { CollisionObject } from "./collisionobject.js";
import { GameObjectManager } from "./gameobjectmanager.js";
import { MapLayer } from "./maplayer.js";
import { Background, BackgroundType } from "./background.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";


const CREATABLE_OBJECTS = [2];
const OBJECT_LAYER_START = 256;


export class Stage {


    private mapLayer : MapLayer;
    private objectLayer : number[] | undefined;
    private objectCreationWaiting : boolean[];

    private background : Background;
    
    public readonly width : number;
    public readonly height : number;


    constructor(mapName : string, backgroundType : BackgroundType, event : ProgramEvent) {

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

        this.background = new Background(backgroundType, event);
    }


    private computeCreationWaitingArray() : Array<boolean> {

        return this.objectLayer.map( (v : number) : boolean => {
            
            const i = v - OBJECT_LAYER_START;
            return (CREATABLE_OBJECTS.includes(i) || (i >= 16 && i <= 32));
        });
    }


    private createObject(tileID : number, x : number, y : number, objects : GameObjectManager) : void {

        // console.log("Created object with index: " + tileID);

        switch (tileID) {

        // Player
        case 1:

            objects.addPlayer(x, y);
            break;

        // Crate
        case 2:

            objects.addCrate(x, y, y*this.width + x);
            break;

        default:

            if (tileID >= 16 && tileID <= 32) {

                objects.addEnemy(x, y, y*this.width + x, tileID - 16);
            }
            break;
        }
    }


    public update(camera : Camera, event : ProgramEvent) : void {

        this.background.update(camera, event);
    }


    public draw(canvas : Canvas, camera : Camera | undefined) : void {

        const bmp = canvas.getBitmap("tileset_void");

        this.mapLayer.draw(canvas, bmp, camera);
    }


    public drawBackground(canvas : Canvas, camera : Camera | undefined) : void {

        this.background.draw(canvas);
    }


    public drawForeground(canvas : Canvas) : void {

        this.background.drawForegorund(canvas);
    }


    public objectCollision(o : CollisionObject, event : ProgramEvent) : void {

        if (!o.isActive())
            return;

        this.mapLayer.objectCollision(o, event);
    }


    public cameraCheck(camera : Camera, objects : GameObjectManager) : void {

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

                this.createObject(this.objectLayer[index] - OBJECT_LAYER_START, x, y, objects);
                this.objectCreationWaiting[index] = false;
            }
        }
    }


    public createInitialObjects(objects : GameObjectManager) : void {

        if (this.objectLayer === undefined)
            return;

        let tileID : number;

        for (let y = 0; y < this.mapLayer.height; ++ y) {

            for (let x = 0; x < this.mapLayer.width; ++ x) {

                tileID = this.objectLayer[y*this.width + x];
                if (tileID <= OBJECT_LAYER_START)
                    continue;

                tileID -= OBJECT_LAYER_START;

                switch (tileID) {

                // Player
                case 1:

                    objects.addPlayer(x, y);
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
    }
}
