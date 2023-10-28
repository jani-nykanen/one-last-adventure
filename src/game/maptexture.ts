import { ProgramEvent } from "../core/event.js";
import { Bitmap } from "../gfx/interface.js";
import { MapLayer } from "./maplayer.js";


export const constructMapTexture = (areaName : string, event : ProgramEvent) : Bitmap | undefined => {

    const baseMap = event.assets.getTilemap(areaName);
    if (baseMap === undefined) {

        console.warn("Could not find a tilemap by name '" + areaName + "'!");
        return undefined;
    }

    const baseCollisions = event.assets.getTilemap("collisions_" + areaName);
    if (baseCollisions === undefined) {
        
        console.warn("Could not find a collision map by name '" + areaName + "'!");
        return undefined;
    }

    const mapLayer = new MapLayer(baseMap, baseCollisions, event);

    return event.createBitmapFromPixelData(
        mapLayer.toImageData(), 
        mapLayer.width, mapLayer.height);
}
