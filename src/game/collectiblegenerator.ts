import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { Camera } from "./camera.js";
import { Crate } from "./crate.js";
import { next } from "./existingobject.js";
import { Collectible, CollectibleType } from "./collectible.js";
import { Stage } from "./stage.js";
import { Player } from "./player.js";


// TODO: The same generator for both collectibles
// and collectibles?
export class CollectibleGenerator {


    private collectibles : Collectible[];


    constructor() {

        this.collectibles = new Array<Collectible> ();
    }


    public spawn(x : number, y : number, 
        speedx : number, speedy : number, type : CollectibleType) : void {

        (next(this.collectibles, Collectible) as Collectible)
            .spawn(x, y, speedx, speedy, type);
    }


    public update(stage : Stage, camera : Camera, player : Player, event : ProgramEvent) : void {

        for (let p of this.collectibles) {

            p.cameraCheck(camera, event);
            p.update(event);
            stage.objectCollision(p, event);
            p.playerCollision(player, event);
        }
    }


    public crateCollision(crates : Crate[], event : ProgramEvent) : void {

        for (let p of this.collectibles) {
            
            if (!p.isActive())
                continue;

            for (let o of crates) {

                o.collisionObjectCollision(p, event);
            }
        }
    }


    public draw(canvas : Canvas) : void {

        const bmp = canvas.getBitmap("collectibles");

        for (let p of this.collectibles) {

            p.draw(canvas, bmp);
        }
    }
}
