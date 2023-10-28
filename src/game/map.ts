import { ProgramEvent } from "../core/event.js";
import { Canvas, Bitmap, Flip } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";
import { Camera } from "./camera.js";
import { getMapName } from "./mapnames.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";


export const enum MapArea {

    Uncharted = 0,
    Island = 1,
    Caves = 2
};


// Map is taken, obviously
export class GameMap {


    private visited : Array<boolean[]>;


    private width : number;
    private height : number;

    private roomWidth : number;
    private roomHeight : number;

    private cpos : Vector;

    private active : boolean = false;

    private area : MapArea = MapArea.Uncharted;

    private flickerTimer : number = 0.0;


    constructor(width : number, height : number, roomWidth : number, roomHeight : number) {

        this.visited = new Array<boolean[]> (2);

        for (let i = 0; i < 2; ++ i) {

            this.visited[i] = (new Array<boolean> (width*height)).fill(false);
        }

        this.roomWidth = roomWidth;
        this.roomHeight = roomHeight;

        this.width = width;
        this.height = height;

        this.cpos = new Vector();
    }


    public update(camera : Camera, event : ProgramEvent) : void {

        const FLICKER_SPEED : number = 1.0/30.0;

        if (this.area < 1 || this.area > 2)
            return;

        this.cpos = camera.getTarget();

        this.cpos.x |= 0;
        this.cpos.y |= 0;

        this.visited[this.area - 1][this.cpos.y*this.width + this.cpos.x] = true;

        this.flickerTimer = (this.flickerTimer + FLICKER_SPEED*event.tick) % 1.0;
    }


    public draw(canvas : Canvas, playerPos : Vector) : void {

        const DARKEN_ALPHA : number = 0.50;

        if (!this.active)
            return;

        const name = getMapName(this.area);
        const mapTexture = canvas.getBitmap(name + "_map"); 

        canvas.setColor(0, 0, 0, DARKEN_ALPHA);
        canvas.fillRect();

        const dw = this.width*this.roomWidth;
        const dh = this.height*this.roomHeight;

        const cornerx = canvas.width/2 - dw/2;
        const cornery = canvas.height/2 - dh/2;

        canvas.setColor(255, 255, 255);
        canvas.fillRect(cornerx - 2, cornery - 2, dw + 4, dh + 4);

        canvas.setColor(0, 0, 0);
        canvas.fillRect(cornerx - 1, cornery - 1, dw + 2, dh + 2);

        canvas.setColor(255, 182, 146);
        canvas.fillRect(cornerx, cornery, dw, dh);

        // Map topology (topography?)
        canvas.setColor();
        canvas.drawBitmap(mapTexture, Flip.None, cornerx, cornery);

        let dx : number;
        let dy : number;

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                dx = cornerx + x*this.roomWidth;
                dy = cornery + y*this.roomHeight;

                if (this.visited[this.area - 1][y*this.width + x]) 
                    continue;

                canvas.setColor(146, 73, 0);
                canvas.fillRect(dx, dy, this.roomWidth, this.roomHeight);
            }
        }

        canvas.setColor(73, 146, 255);

        dx = (cornerx + this.cpos.x*this.roomWidth) | 0;
        dy = (cornery + this.cpos.y*this.roomHeight) | 0;

        canvas.fillRect(dx, dy, this.roomWidth, 1);
        canvas.fillRect(dx, dy + this.roomHeight, this.roomWidth, 1);
        canvas.fillRect(dx, dy, 1, this.roomHeight);
        canvas.fillRect(dx + this.roomWidth, dy, 1, this.roomHeight + 1);

        if (this.flickerTimer <= 0.5) {

            canvas.setColor(255, 0, 0);
            canvas.fillRect(
                cornerx + ((playerPos.x/TILE_WIDTH) | 0) - 1, 
                cornery + ((playerPos.y/TILE_HEIGHT) | 0) - 1,
                3, 3);
        }

        canvas.setColor();
    }


    public activate() : void {

        this.active = true;
        this.flickerTimer = 0.0;
    }


    public deactivate() : void {

        this.active = false;
    }


    public isActive = () : boolean => this.active;


    public setArea(area : MapArea) : void {

        this.area = area;
    }


    public save(key : string) : boolean {

        try {

            const visitedData = JSON.stringify(this.visited);
            window["localStorage"]?.["setItem"]?.(key, visitedData);
        }
        catch (e : any) {

            console.warn("Error saving the map data: " + e["message"]);
            return false;
        }

        return true;
    }


    public load(key : string) : boolean {

        try {

            const dataStr = window["localStorage"]?.["getItem"]?.(key);
            if (dataStr === undefined) {

                return true;
            }

            const dataJSON = JSON.parse(dataStr);
            for (let i = 0; i < dataJSON["length"] ?? 0; ++ i) {

                this.visited[i] = Array.from(dataJSON[i]);
            }
        }
        catch (e : any) {

            console.warn("Error saving the map data: " + e["message"]);
            return false;
        }

        return true;
    }
}
