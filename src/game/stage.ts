import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { Camera } from "./camera.js";
import { CollisionObject } from "./collisionobject.js";
import { MapLayer } from "./maplayer.js";



export class Stage {


    private mapLayer : MapLayer;


    constructor(event : ProgramEvent) {

        this.mapLayer = new MapLayer("void", event);
    }


    public draw(canvas : Canvas, camera : Camera | undefined) : void {

        const bmp = canvas.getBitmap("tileset_void");

        this.mapLayer.draw(canvas, bmp, camera);
    }


    public objectCollision(o : CollisionObject, event : ProgramEvent) : void {

        this.mapLayer.objectCollision(o, event);
    }
}
