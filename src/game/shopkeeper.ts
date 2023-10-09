import { ActivableObject } from "./activableobject.js";
import { TextBox } from "../ui/textbox.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle } from "../math/rectangle.js";
import { ProgramEvent } from "../core/event.js";
import { Player, SpecialPlayerAnimationType } from "./player.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";
import { Shop } from "./shop.js";


export class Shopkeeper extends ActivableObject {


    private shop : Shop;

    private spr : Sprite;


    constructor(x : number, y : number, shop : Shop) {

        super(x, y);

        this.shop = shop;

        this.spr = new Sprite(24, 32);

        this.hitbox = new Rectangle(0, 2, 16, 12);

        this.facePlayer = true;

        this.cameraCheckArea = new Vector(24, 24);

        this.inCamera = true;
    }


    protected activationEvent(player : Player, event : ProgramEvent): void {
        
        event.audio.playSample(event.assets.getSample("select"), 0.60);

        this.shop.activate();
    }


    protected updateEvent(event: ProgramEvent): void {

        const ANIM_SPEED : number = 12;

        this.spr.animate(0, 0, 3, ANIM_SPEED, event.tick);
    }


    public draw(canvas : Canvas) : void {
        
        if (!this.exist || !this.inCamera)
            return;

        const bmp = canvas.getBitmap("shopkeeper");

        const flip = this.dir > 0 ? Flip.Horizontal : Flip.None;

        const dx = Math.round(this.pos.x) - 12;
        const dy = Math.round(this.pos.y) - 23;

        this.spr.draw(canvas, bmp, dx, dy, flip);
    }
}
