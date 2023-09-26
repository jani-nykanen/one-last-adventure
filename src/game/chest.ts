import { ActivableObject } from "./activableobject.js";
import { TextBox } from "../ui/textbox.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle } from "../math/rectangle.js";
import { ProgramEvent } from "../core/event.js";
import { Player, SpecialPlayerAnimationType } from "./player.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";


export class Chest extends ActivableObject {

    
    private id : number;

    private textbox : TextBox;

    private spr : Sprite;


    constructor(x : number, y : number, id : number, textbox : TextBox) {

        super(x, y);

        this.id = id;
        this.textbox = textbox;

        this.spr = new Sprite(32, 32);

        this.hitbox = new Rectangle(0, 2, 20, 20);

        this.facePlayer = true;

        this.cameraCheckArea = new Vector(32, 32);
    }


    protected die(event : ProgramEvent) : boolean {
        
        const DEATH_SPEED : number = 5;

        this.spr.animate(1, 0, 7, DEATH_SPEED, event.tick);

        return this.spr.getColumn() == 7;
    }


    protected activationEvent(player : Player, event : ProgramEvent): void {
        
        this.dying = true;
        this.spr.setFrame(0, 1);

        player.toggleSpecialAnimation(SpecialPlayerAnimationType.HoldItem, this.id,
            (event : ProgramEvent) => {

                const itemIDStr = "item" + String(this.id);

                player.progress.setProperty(itemIDStr, 1);
                this.textbox.addText(event.localization?.getItem(itemIDStr) ?? []);
                this.textbox.activate();
            });
    }


    protected updateEvent(event: ProgramEvent): void {

        const ANIM_SPEED : number = 15;

        this.spr.animate(0, 0, 3, ANIM_SPEED, event.tick);
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {
        
        if (!this.exist || !this.inCamera)
            return;

        const flip = this.dir > 0 ? Flip.Horizontal : Flip.None;

        const dx = Math.round(this.pos.x) - 16;
        const dy = Math.round(this.pos.y) - 20;

        this.spr.draw(canvas, bmp, dx, dy, flip);
    }
}
