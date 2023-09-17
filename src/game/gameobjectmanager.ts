import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { Player } from "./player.js";


export class GameObjectManager {
    
    
    private player : Player | undefined = undefined;


    constructor(event : ProgramEvent) {

        this.player = new Player(event.screenWidth/2, 32);
    }


    public update(event : ProgramEvent) : void {

        this.player?.update(event);
        this.player?.updateCollisionFlags();

        // Test collisions
        this.player?.verticalCollision(0, event.screenHeight - 32, event.screenWidth, 1, event);
        this.player?.horizontalCollision(0, 0, event.screenHeight, -1, event);
        this.player?.horizontalCollision(event.screenWidth, 0, event.screenHeight, 1, event);
    }


    public draw(canvas : Canvas) : void {

        this.player?.draw(canvas);
    }
}
