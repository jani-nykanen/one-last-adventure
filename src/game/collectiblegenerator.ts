import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { Camera } from "./camera.js";
import { Crate } from "./crate.js";
import { next } from "./existingobject.js";
import { Collectible, CollectibleType } from "./collectible.js";
import { Stage } from "./stage.js";
import { Player } from "./player.js";
import { Vector } from "../math/vector.js";


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


    public spawnWeighted(pos : Vector, dir : Vector, healthWeight : number = 0.0) : void {

        const DROP_PROB : number = 0.50; // TODO: pass as parameter
        const HEALTH_BASE_PROB : number = 0.5;

        // TODO: Spawn hearts/magic potions depending on player
        // health & magic count?

        if (Math.random() > DROP_PROB)
            return;

        const speedx = dir.x*(0.5 + Math.random()*1.0);
        const speedy = -1.5 + Math.min(0, dir.y*(0.5 + Math.random()*0.5));

        let type = CollectibleType.Coin;
        if (Math.random() < HEALTH_BASE_PROB*healthWeight)
            type = CollectibleType.Heart;

        this.spawn(pos.x, pos.y, speedx, speedy, type);
    }


    public update(stage : Stage, camera : Camera, player : Player, event : ProgramEvent) : void {

        for (let p of this.collectibles) {

            p.cameraCheck(camera, event);
            p.update(event);
            stage.objectCollision(p, event);
            p.playerCollision(player, event);
        }
    }


    public crateCollision(crates : Crate[], player : Player, event : ProgramEvent) : void {

        for (let p of this.collectibles) {
            
            if (!p.isActive())
                continue;

            for (let o of crates) {

                o.collisionObjectCollision(p, player, event);
            }
        }
    }


    public draw(canvas : Canvas) : void {

        const bmp = canvas.getBitmap("collectibles");

        for (let p of this.collectibles) {

            p.draw(canvas, bmp);
        }
    }


    public clear() : void {

        for (let o of this.collectibles) {

            o.forceKill();
        }
    }
}
