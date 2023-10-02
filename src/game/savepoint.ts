import { ActivableObject } from "./activableobject.js";
import { TextBox } from "../ui/textbox.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle } from "../math/rectangle.js";
import { ProgramEvent } from "../core/event.js";
import { Player, SpecialPlayerAnimationType } from "./player.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";


export class SavePoint extends ActivableObject {


    private spr : Sprite;
    private active : boolean = false;

    private dialogueCb : (event : ProgramEvent) => void;


    constructor(x : number, y : number, dialogueCb : (event : ProgramEvent) => void) {

        super(x, y);

        this.spr = new Sprite(16, 16);

        this.hitbox = new Rectangle(0, 2, 12, 12);

        this.facePlayer = false;

        this.cameraCheckArea = new Vector(24, 24);
        this.inCamera = true;

        this.dialogueCb = dialogueCb;
    }


    protected playerTouchEvent(player : Player, event : ProgramEvent, initial : boolean): void {

        if (!this.active) {

            if (!initial) {

                event.audio.playSample(event.assets.getSample("savepoint"), 0.50);
            }

            this.active = true;
            player.setCheckpoint(this.pos.x, this.pos.y);

            this.spr.setFrame(1, 0);

            player.setActiveSavePoint(this);
        }
    }


    protected activationEvent(player : Player, event : ProgramEvent): void {

        event.audio.playSample(event.assets.getSample("select"), 0.50);

        this.dialogueCb(event);
    }


    protected generalPlayerEvent(player : Player, event : ProgramEvent) : void {

        if (!player.isActiveSavepoint(this)) {

            this.active = false;
            this.spr.setFrame(0, 0);
        }
    }


    protected updateEvent(event : ProgramEvent): void {

        const ANIM_SPEED : number = 6;

        if (this.active) {

            this.spr.animate(0, 1, 8, ANIM_SPEED, event.tick);
        }
    }


    public draw(canvas : Canvas) : void {
        
        if (!this.exist || !this.inCamera)
            return;

        const bmp = canvas.getBitmap("savepoint");

        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y) - 8;

        this.spr.draw(canvas, bmp, dx, dy);
    }
}
