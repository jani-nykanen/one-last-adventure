import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { Camera } from "./camera.js";
import { CollisionObject } from "./collisionobject.js";
import { Crate } from "./crate.js";
import { next } from "./existingobject.js";
import { Projectile } from "./projectile.js";
import { Stage } from "./stage.js";


export class ProjectileGenerator {


    private projectiles : Projectile[];


    constructor() {

        this.projectiles = new Array<Projectile> ();
    }


    public spawn(x : number, y : number, speedx : number, speedy : number, id : number, friendly : boolean = true) : void {

        (next(this.projectiles, Projectile) as Projectile).spawn(x, y, speedx, speedy, id, friendly);
    }


    public update(stage : Stage, camera : Camera, event : ProgramEvent) : void {

        for (let p of this.projectiles) {

            p.cameraCheck(camera, event);
            p.update(event);
            stage.objectCollision(p, event);
        }
    }


    public crateCollision(crates : Crate[], event : ProgramEvent) : void {

        for (let p of this.projectiles) {
            
            if (!p.isActive())
                continue;

            for (let o of crates) {

                o.collisionObjectCollision(p, event, true);
            }
        }
    }


    public cameraCheck(camera : Camera, event : ProgramEvent) : void {

        for (let p of this.projectiles) {
            
            p.cameraCheck(camera, event);
        }
    }


    public draw(canvas : Canvas) : void {

        const bmp = canvas.getBitmap("projectiles");

        for (let p of this.projectiles) {

            p.draw(canvas, bmp);
        }
    }


    public clear() : void {

        for (let o of this.projectiles) {

            o.forceKill();
        }
    }
}
