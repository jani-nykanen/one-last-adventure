import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { Camera } from "./camera.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";


export class GameObjectManager {
    
    
    private player : Player | undefined = undefined;


    constructor(event : ProgramEvent) {

        // this.player = new Player(event.screenWidth/2, 32);
    }


    public update(camera : Camera | undefined, stage : Stage | undefined, event : ProgramEvent) : void {

        if (camera.isMoving()) {

            this.player?.cameraCollision(camera, event);
            return;
        }

        this.player?.update(event);
        this.player?.updateCollisionFlags();
        this.player?.cameraCollision(camera, event);

        stage?.objectCollision(this.player, event);
    }


    public draw(canvas : Canvas) : void {

        this.player?.draw(canvas);
    }


    public addPlayer(x : number, y : number) : void {

        this.player = this.player ?? new Player((x + 0.5)*TILE_WIDTH, (y + 0.5)*TILE_HEIGHT);
    }
}
