import { ActivableObject } from "./activableobject.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle } from "../math/rectangle.js";
import { ProgramEvent } from "../core/event.js";
import { Player } from "./player.js";
import { Bitmap, Canvas } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";


export class Portal extends ActivableObject {

    
    private spr : Sprite;

    private cb : (event : ProgramEvent) => void;


    constructor(x : number, y : number, useCb : (event : ProgramEvent) => void) {

        super(x, y);

        this.spr = new Sprite(32, 48);

        this.hitbox = new Rectangle(0, 0, 16, 16);

        this.facePlayer = false;

        this.cameraCheckArea = new Vector(36, 48);

        this.cb = useCb;
    }


    protected activationEvent(player : Player, event : ProgramEvent): void {
        
        this.cb(event);
    }


    protected updateEvent(event: ProgramEvent): void {

        const ANIM_SPEED : number = 6;

        this.spr.animate(0, 0, 3, ANIM_SPEED, event.tick);
    }


    public draw(canvas : Canvas) : void {
        
        if (!this.exist || !this.inCamera)
            return;

        const bmp = canvas.getBitmap("portal");

        const dx = Math.round(this.pos.x) - 16;
        const dy = Math.round(this.pos.y) - 40;

        this.spr.draw(canvas, bmp, dx, dy);
    }
}
