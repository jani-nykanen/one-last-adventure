import { ActivableObject } from "./activableobject.js";
import { TextBox } from "../ui/textbox.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle } from "../math/rectangle.js";
import { ProgramEvent } from "../core/event.js";
import { Player, SpecialPlayerAnimationType } from "./player.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";


export class NPC extends ActivableObject {

    
    private id : number;

    private textbox : TextBox;

    private spr : Sprite;


    constructor(x : number, y : number, id : number, textbox : TextBox) {

        super(x, y);

        this.id = id;
        this.textbox = textbox;

        this.spr = new Sprite(16, 16);

        this.hitbox = new Rectangle(0, 2, 12, 12);

        this.facePlayer = true;

        this.cameraCheckArea = new Vector(24, 24);

        this.inCamera = true;
    }


    protected activationEvent(player : Player, event : ProgramEvent): void {
        
        event.audio.playSample(event.assets.getSample("select"), 0.60);

        const idStr = "npc" + String(this.id);

        player.showActionIcon(-1);

        this.textbox.addText(event.localization?.getItem(idStr) ?? []);
        this.textbox.activate(false, (event : ProgramEvent) => event.audio.resumeMusic());
    }


    protected updateEvent(event: ProgramEvent): void {

        const ANIM_SPEED : number = 12;

        this.spr.animate(0, 0, 3, ANIM_SPEED, event.tick);
    }


    public draw(canvas : Canvas) : void {
        
        if (!this.exist || !this.inCamera)
            return;

        const bmp = canvas.getBitmap("npc");

        const flip = this.dir > 0 ? Flip.Horizontal : Flip.None;

        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y) - 7;

        this.spr.draw(canvas, bmp, dx, dy, flip);
    }
}
