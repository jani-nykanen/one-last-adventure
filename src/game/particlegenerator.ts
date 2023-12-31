import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { Camera } from "./camera.js";
import { CollisionObject } from "./collisionobject.js";
import { Crate } from "./crate.js";
import { next } from "./existingobject.js";
import { Particle } from "./particle.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";


export class ParticleGenerator {


    private particles : Particle[];


    constructor() {

        this.particles = new Array<Particle> ();
    }


    public spawn(x : number, y : number, 
        speedx : number, speedy : number, 
        column : number, row : number) : void {

        (next(this.particles, Particle) as Particle).spawn(x, y, speedx, speedy, column, row);
    }


    public update(stage : Stage, camera : Camera, event : ProgramEvent) : void {

        for (let p of this.particles) {

            p.cameraCheck(camera, event);
            p.update(event);
            stage.objectCollision(p, event);
        }
    }


    public crateCollision(crates : Crate[], player : Player, event : ProgramEvent) : void {

        for (let p of this.particles) {
            
            if (!p.isActive())
                continue;

            for (let o of crates) {

                o.collisionObjectCollision(p, player, event);
            }
        }
    }


    public draw(canvas : Canvas) : void {

        const bmp = canvas.getBitmap("particles");

        for (let p of this.particles) {

            p.draw(canvas, bmp);
        }
    }


    public clear() : void {

        for (let o of this.particles) {

            o.forceKill();
        }
    }
}
