import { Tilemap } from "../tilemap/tilemap.js";
import { ProgramEvent } from "../core/event.js";


const enum Collision {

    Top = 0b1,
    Right = 0b10,
    Bottom = 0b100,
    Left = 0b1000,

    LadderBase = 0b10000,
    LadderTop = 0b100000
}



export class MapLayer {


    private layers : number[][];
    private collisionData : number[];

    private readonly baseMap : Tilemap;
    private readonly baseCollision : Tilemap;


    constructor(mapName : string, event : ProgramEvent) {

        const LAYER_NAMES = ["bottom", "middle", "top"];

        const baseMap = event.assets.getTilemap(mapName);
        const baseCollision = event.assets.getTilemap("collisions_" + mapName);

        if (baseMap === undefined || baseCollision === undefined) {

            throw new Error("Could not create map layer: missing tilemap and/or collision layer: " + mapName + "!");
        }

        this.baseMap = baseMap;
        this.baseCollision = baseCollision;

        let data : number[] | undefined;

        this.layers = new Array<number[]> ();
        for (let i = 0; i < 3; ++ i) {

            data = baseMap.cloneLayer(LAYER_NAMES[i]);
            // We could as well stop here, no reason to have only "bottom" and "top" layers
            // without a "middle" layer. Having only the bottom layer, on the other hand,
            // is perfectly fine.
            if (data === undefined)
                break;

            this.layers.push(data);

        }

        this.collisionData = (new Array<number> (16*16)).fill(0);;

        const layers = new Array<number[]>(4);
        // TODO: Some checks missing
        for (let i = 0; i < 4; ++ i) {

            layers[i] = baseCollision.cloneLayer(String(i + 1)) ?? [];
        }

        for (let j = 0; j < 256; ++ j) {

            for (let i = 0; i < 4; ++ i) {

                this.collisionData[j] |= layers[i][j];
            }
        }
    }

}
