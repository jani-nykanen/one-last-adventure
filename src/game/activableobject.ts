import { GameObject } from "./gameobject.js";
import { Rectangle } from "../math/rectangle.js";
import { ProgramEvent } from "../core/event.js";
import { Player } from "./player.js";


export class ActivableObject extends GameObject {


    protected dir : -1 | 1 = -1;
    protected facePlayer : boolean = false;


    constructor(x : number, y : number) {

        super(x, y, true);
    }


    protected activationEvent?(player : Player, event : ProgramEvent) : void;


    public playerCollision(player : Player, event : ProgramEvent) : boolean {

        if (!player.isActive() || !this.isActive())
            return false;

        if (this.facePlayer) {

            this.dir = player.getPosition().x < this.pos.x ? -1 : 1;
        }

        if (player.overlay(this) && player.doesTouchSurface()) {
            
            player.showActionIcon(0);

            if (event.input.upPress()) {

                this.activationEvent?.(player, event);
                return true;
            }
        }
        return false;
    }
}
