import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { Camera } from "./camera.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";
import { Crate } from "./crate.js";


export class GameObjectManager {
    
    
    private player : Player | undefined = undefined;
    private crates : Crate[];


    constructor(event : ProgramEvent) {

        this.crates = new Array<Crate> ();
    }


    private cameraCheck(camera : Camera, event : ProgramEvent) : void {

        for (let c of this.crates) {

            c.cameraCheck(camera, event);
        }
    }


    public update(camera : Camera | undefined, stage : Stage | undefined, event : ProgramEvent) : void {

        if (camera?.isMoving()) {

            stage.cameraCheck(camera, this);

            this.player?.cameraCollision(camera, event);
            this.cameraCheck(camera, event);

            return;
        }

        this.player?.update(event);
        this.player?.updateCollisionFlags();
        this.player?.cameraCollision(camera, event);
        stage?.objectCollision(this.player, event);

        let c1 : Crate;
        let c2 : Crate;

        for (let i = 0; i < this.crates.length; ++ i) {

            c1 = this.crates[i];

            c1.cameraCheck(camera, event);
            c1.update(event);

            stage.objectCollision(c1, event);

            if (!c1.doesExist()) {

                this.crates.splice(i, 1);
                continue;
            }
           
            for (let j = i; j < this.crates.length; ++ j) {

                c2 = this.crates[j];
                c2.collisionObjectCollision(c1, event);
            }

            if (this.player !== undefined) {

                c1.collisionObjectCollision(this.player, event);
                c1.playerCollision(this.player, event);
            }
        }
    }


    public draw(canvas : Canvas) : void {

        const bmpCrate = canvas.getBitmap("crate");

        for (let c of this.crates) {

            c.draw(canvas, bmpCrate);
        }

        this.player?.draw(canvas);
    }


    public addPlayer(x : number, y : number) : void {

        this.player = this.player ?? new Player((x + 0.5)*TILE_WIDTH, (y + 0.5)*TILE_HEIGHT);
    }


    public addCrate(x : number, y : number) : void {

        this.crates.push(new Crate((x + 0.5)*TILE_WIDTH, (y + 0.5)*TILE_HEIGHT));
    }
}
