import { Sprite } from "../gfx/sprite.js";
import { Rectangle } from "../math/rectangle.js";
import { ProgramEvent } from "../core/event.js";
import { Player } from "./player.js";
import { Bitmap, Canvas } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";
import { TransitionType } from "../core/transition.js";
import { RGBA } from "../math/rgba.js";
import { ActivableObject } from "./activableobject.js";
import { Camera } from "./camera.js";


export class Door extends ActivableObject{


    private cb : ((event : ProgramEvent) => void) | undefined = undefined;


    constructor(x : number, y : number, useCb : (event : ProgramEvent) => void) {

        super(x, y);

        this.hitbox = new Rectangle(0, 0, 12, 16);

        this.facePlayer = false;

        this.cameraCheckArea = new Vector(16, 16);

        this.cb = useCb;
    
        this.inCamera = true;
    }


    protected activationEvent(player : Player, event : ProgramEvent, camera? : Camera): void {
        
        player.showActionIcon(-1);
        player.setPosition(this.pos.x, this.pos.y);
        player.setFrame(4, 2);

        event.audio.stopMusic();
        event.audio.playSample(event.assets.getSample("door"), 0.45);

        const ppos = player.getPosition();
        player.setCheckpoint(ppos.x, ppos.y);

        event.transition.activate(true, TransitionType.Circle, 1.0/60.0, event,
            (event : ProgramEvent) => this.cb?.(event), new RGBA(0, 0, 0));

        if (camera !== undefined) {

            event.transition.setCenter(
                new Vector(
                    ppos.x % camera.width,
                    ppos.y % camera.height
                )
            );
        }
    }
}
