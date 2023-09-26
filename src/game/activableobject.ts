import { GameObject } from "./gameobject.js";
import { Sprite } from "../gfx/sprite.js";
import { Vector } from "../math/vector.js";
import { Rectangle } from "../math/rectangle.js";
import { ProgramEvent } from "../core/event.js";
import { Player } from "./player.js";
import { FlyingMessageGenerator } from "./flyingmessagegenerator.js";
import { CollectibleGenerator } from "./collectiblegenerator.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Camera } from "./camera.js";
import { TextBox } from "../ui/textbox.js";


export class ActivableObject extends GameObject {




    constructor(x : number, y : number) {

        super(x, y, true);

        this.hitbox = new Rectangle(0, 2, 20, 20);
    }


    protected activationEvent?(player : Player, event : ProgramEvent) : void;


    public playerCollision(player : Player, event : ProgramEvent) : void {

        if (!player.isActive() || !this.isActive())
            return;
    }
}
