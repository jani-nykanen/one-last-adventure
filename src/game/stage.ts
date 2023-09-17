import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { Camera } from "./camera.js";
import { CollisionObject } from "./collisionobject.js";
import { GameObjectManager } from "./gameobjectmanager.js";
import { MapLayer } from "./maplayer.js";



export class Stage {


    private mapLayer : MapLayer;
    private objectLayer : number[] | undefined;
    
    public readonly width : number;
    public readonly height : number;


    constructor(mapName : string, event : ProgramEvent) {

        const baseMap = event.assets.getTilemap(mapName);
        const baseCollision = event.assets.getTilemap("collisions_" + mapName);

        if (baseMap === undefined || baseCollision === undefined) {

            throw new Error("Missing tilemap and/or collision layer: " + mapName + "!");
        }

        this.mapLayer = new MapLayer(baseMap, baseCollision, event);

        this.width = baseMap.width;
        this.height = baseMap.height;

        this.objectLayer = baseMap.cloneLayer("objects");
    }


    public draw(canvas : Canvas, camera : Camera | undefined) : void {

        const bmp = canvas.getBitmap("tileset_void");

        this.mapLayer.draw(canvas, bmp, camera);
    }


    public objectCollision(o : CollisionObject, event : ProgramEvent) : void {

        this.mapLayer.objectCollision(o, event);
    }


    public parseObjects(objects : GameObjectManager) : void {

        if (this.objectLayer === undefined)
            return;

        let tileID : number;

        for (let y = 0; y < this.mapLayer.height; ++ y) {

            for (let x = 0; x < this.mapLayer.width; ++ x) {

                tileID = this.objectLayer[y*this.width + x];
                if (tileID <= 256)
                    continue;

                tileID -= 256;

                switch (tileID) {

                // Player
                case 1:

                    objects.addPlayer(x, y);
                    break;

                // Crate
                case 2:

                    // TODO: This
                    break;

                default:
                    break;
                }
            }
        }
    }
}
