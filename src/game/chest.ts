import { ActivableObject } from "./activableobject.js";
import { TextBox } from "../ui/textbox.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle } from "../math/rectangle.js";
import { ProgramEvent } from "../core/event.js";
import { Player, SpecialPlayerAnimationType } from "./player.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";



export const enum ChestType {

    Item = 0,
    Gem = 1,
    Life = 2,
    Magic = 3
};


const TYPE_NAMES : string[] = ["item", "gem", "life", "magic"];


export class Chest extends ActivableObject {

    
    private id : number;
    private type : ChestType;

    private textbox : TextBox;

    private spr : Sprite;

    private hintCb : (x : number, y : number, id : number, event : ProgramEvent) => void;


    constructor(x : number, y : number, id : number, type : ChestType, textbox : TextBox,
        createHintCb : (x : number, y : number, id : number, event : ProgramEvent) => void) {

        super(x, y);

        this.id = id;
        this.type = type;

        this.textbox = textbox;

        this.spr = new Sprite(32, 32);
        this.spr.setFrame(0, this.type*2);

        this.hitbox = new Rectangle(0, 2, 20, 20);

        this.facePlayer = true;

        this.cameraCheckArea = new Vector(32, 32);

        this.hintCb = createHintCb;

        this.inCamera = true;
    }


    protected die(event : ProgramEvent) : boolean {
        
        const DEATH_SPEED : number = 5;

        this.spr.animate(this.type*2 + 1, 0, 7, DEATH_SPEED, event.tick);

        return this.spr.getColumn() == 7;
    }


    protected activationEvent(player : Player, event : ProgramEvent): void {
        
        this.dying = true;
        this.spr.setFrame(0, this.type*2 + 1);

        event.audio.pauseMusic();
        event.audio.playSample(event.assets.getSample("item"), 0.80);

        let itemSpriteID = this.id;
        if (this.type == ChestType.Gem)
            itemSpriteID = 7;

        player.toggleSpecialAnimation(SpecialPlayerAnimationType.HoldItem, itemSpriteID,
            (event : ProgramEvent) => {

                const itemIDStr = TYPE_NAMES[this.type] + String(this.id);

                player.progress.setProperty(itemIDStr, 1);

                switch (this.type) {

                case ChestType.Item:

                    this.textbox.addText(event.localization?.getItem(itemIDStr) ?? []);
                    break;

                case ChestType.Gem:

                    this.textbox.addText(event.localization?.getItem("gem") ?? []);
                    player.progress.updateProperty("gems", 1);

                    break;

                default:
                    break;
                }
                
                this.textbox.activate(false, (event : ProgramEvent) => event.audio.resumeMusic());

                player.setCheckpoint(this.pos.x, this.pos.y);
                
                if (this.type == ChestType.Item) {

                    this.hintCb(this.pos.x, this.pos.y, this.id, event);
                }
            });
    }


    protected updateEvent(event: ProgramEvent): void {

        const ANIM_SPEED : number = 15;

        this.spr.animate(this.type*2, 0, 3, ANIM_SPEED, event.tick);
    }


    public draw(canvas : Canvas) : void {
        
        if (!this.exist || !this.inCamera)
            return;

        const bmp = canvas.getBitmap("chest");

        const flip = this.dir > 0 ? Flip.Horizontal : Flip.None;

        const dx = Math.round(this.pos.x) - 16;
        const dy = Math.round(this.pos.y) - 20;

        this.spr.draw(canvas, bmp, dx, dy, flip);
    }
}
