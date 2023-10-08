import { GameObject } from "./gameobject.js";
import { Rectangle } from "../math/rectangle.js";
import { ProgramEvent } from "../core/event.js";
import { Player } from "./player.js";
import { Camera } from "./camera.js";


export class ActivableObject extends GameObject {


    protected dir : -1 | 1 = -1;
    protected facePlayer : boolean = false;


    constructor(x : number, y : number) {

        super(x, y, true);
    }


    protected activationEvent?(player : Player, event : ProgramEvent, camera? : Camera) : void;
    protected playerTouchEvent?(player : Player, event : ProgramEvent, initial? : boolean) : void;
    protected generalPlayerEvent?(player : Player, event : ProgramEvent) : void;


    public playerCollision(player : Player, camera : Camera, event : ProgramEvent, initial : boolean = false) : boolean {

        if (!player.isActive() || !this.isActive())
            return false;

        if (this.facePlayer) {

            this.dir = player.getPosition().x < this.pos.x ? -1 : 1;
        }

        this.generalPlayerEvent?.(player, event);

        if (player.overlay(this) && (player.doesTouchSurface() || initial)) {
            
            this.playerTouchEvent?.(player, event, initial);
            if (initial)
                return true;

            player.showActionIcon(0);

            if (event.input.upPress()) {

                this.activationEvent?.(player, event, camera);
                return true;
            }
        }
        return false;
    }
}
