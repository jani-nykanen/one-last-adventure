import { Tilemap } from "../tilemap/tilemap.js";
import { ProgramEvent } from "../core/event.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Camera } from "./camera.js";
import { Vector } from "../math/vector.js";
import { CollisionObject } from "./collisionobject.js";
import { TILE_WIDTH, TILE_HEIGHT } from "./tilesize.js";


const enum Collision {

    Top = 0b1,
    Right = 0b10,
    Bottom = 0b100,
    Left = 0b1000,

    LadderBase = 0b10000,
    LadderTop = 0b100000,

    HurtBottom = 1 << 6,
    HurtTop = 1 << 7,
    HurtLeft = 1 << 8,
    HurtRight = 1 << 9
}


export class MapLayer {


    private layers : number[][];
    private collisionData : number[];


    public readonly width : number;
    public readonly height : number;


    constructor(baseMap : Tilemap, baseCollision : Tilemap, event : ProgramEvent) {

        const LAYER_NAMES = ["bottom", "middle", "top"];


        this.width = baseMap.width;
        this.height = baseMap.height;

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


        let v : number;
        for (let j = 0; j < 256; ++ j) {

            for (let i = 0; i < 4; ++ i) {

                v = layers[i][j] ?? 0;
                if (v < 257)
                    continue;

                v -= 257;

                this.collisionData[j] |= ((1 << v) ?? 0);
            }
        }
    }


    private getTile(x : number, y : number, layer : number, def = 0) : number {

        if (x < 0 || y < 0 || x >= this.width || y >= this.height ||
            layer < 0 || layer >= this.layers.length)
            return def;

        return this.layers[layer][y*this.width + x];
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined, camera : Camera | undefined) : void {

        const camPos = camera?.getTopCorner() ?? new Vector();

        const startx = Math.round(camPos.x/TILE_WIDTH) - 1;
        const starty = Math.round(camPos.y/TILE_HEIGHT) - 1;

        const endx = startx + Math.round(canvas.width/TILE_WIDTH) + 2;
        const endy = starty + Math.round(canvas.height/TILE_HEIGHT) + 2;

        let tileID : number;
        let sx : number;
        let sy : number;

        for (let layer = 0; layer < this.layers.length; ++ layer) {

            for (let y = starty; y < endy; ++ y) {

                for (let x = startx; x < endx; ++ x) {

                    tileID = this.getTile(x, y, layer);
                    if (tileID <= 0)
                        continue;

                    sy = ((tileID - 1) / 16) | 0;
                    sx = (tileID - 1) % 16;

                    canvas.drawBitmap(bmp, Flip.None, 
                        x*TILE_WIDTH, y*TILE_HEIGHT, 
                        sx*TILE_WIDTH, sy*TILE_HEIGHT, 
                        TILE_WIDTH, TILE_HEIGHT);
                }
            }
        }
    }


    public objectCollision(o : CollisionObject, event : ProgramEvent) : void {

        const MARGIN = 1;

        const HURT_WIDTH : number = 16;
        const HURT_HEIGHT : number = 8;
        const HURT_DAMAGE : number = 2;
        const HURT_COL_HEIGHT : number = 6;

        const opos = o.getPosition();

        const startx = Math.round(opos.x/TILE_WIDTH) - MARGIN;
        const starty = Math.round(opos.y/TILE_HEIGHT) - MARGIN;

        const endx = startx + MARGIN*2;
        const endy = starty + MARGIN*2;

        let collisionID : number;
        let tileID : number;

        let dx : number;
        let dy : number;
        let hurtY : number;
        let hurtColY : number;

        for (let layer = 0; layer < this.layers.length; ++ layer) {

            for (let y = starty; y <= endy; ++ y) {

                for (let x = startx; x <= endx; ++ x) {

                    tileID = this.getTile(x, y, layer);
                    if (tileID <= 0)
                        continue;

                    dx = x*TILE_WIDTH;
                    dy = y*TILE_HEIGHT;

                    collisionID = this.collisionData[tileID - 1];

                    // Walls
                    if ((collisionID & Collision.Top) != 0) {

                        o.verticalCollision(dx, dy, TILE_WIDTH, 1, event);
                    }
                    if ((collisionID & Collision.Bottom) != 0) {

                        o.verticalCollision(dx, dy + TILE_HEIGHT, TILE_WIDTH, -1, event);
                    }
                    if ((collisionID & Collision.Right) != 0) {

                        o.horizontalCollision(dx + TILE_WIDTH, dy, TILE_HEIGHT, -1, event);
                    }
                    if ((collisionID & Collision.Left) != 0) {

                        o.horizontalCollision(dx, dy, TILE_HEIGHT, 1, event);
                    }

                    // Ladder
                    if ((collisionID & Collision.LadderBase) != 0) {

                        o.ladderCollision?.(dx + 4, dy + 2, 8, 12, false, event);
                    }
                    if ((collisionID & Collision.LadderTop) != 0) {

                        o.ladderCollision?.(dx + 4, dy + 14, 8, 2, true, event);
                    }


                    // Hurt collision
                    if ((collisionID & Collision.HurtBottom) != 0) {

                        hurtY = dy + TILE_HEIGHT - HURT_HEIGHT;

                        o.hurtCollision?.(
                            dx + TILE_WIDTH/2 - HURT_WIDTH/2, hurtY,
                            HURT_WIDTH, HURT_HEIGHT, HURT_DAMAGE, event);


                        hurtColY = dy + TILE_HEIGHT - HURT_COL_HEIGHT;
                        o.verticalCollision(dx, hurtColY, TILE_WIDTH, 1, event);
                        o.horizontalCollision(dx, hurtColY, HURT_COL_HEIGHT, 1, event);
                        o.horizontalCollision(dx + TILE_WIDTH, hurtColY, HURT_COL_HEIGHT, -1, event);
                    }
                    if ((collisionID & Collision.HurtTop) != 0) {

                        hurtY = dy;

                        o.hurtCollision?.(
                            dx + TILE_WIDTH/2 - HURT_WIDTH/2, hurtY,
                            HURT_WIDTH, HURT_HEIGHT, HURT_DAMAGE, event);
                            
                        o.verticalCollision(dx, hurtY + HURT_COL_HEIGHT, TILE_WIDTH, -1, event);
                        o.horizontalCollision(dx, hurtY, HURT_COL_HEIGHT, 1, event);
                        o.horizontalCollision(dx + TILE_WIDTH, hurtY, HURT_COL_HEIGHT, -1, event);
                    }
                    // TODO: Remaining spike collisions
                }
            }
        }
    }
}
