import { ActivableObject } from "./activableobject.js";
import { TextBox } from "../ui/textbox.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle } from "../math/rectangle.js";
import { ProgramEvent } from "../core/event.js";
import { Player, SpecialPlayerAnimationType } from "./player.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";


export class Switch extends ActivableObject {

    
    private textbox : TextBox;

    private spr : Sprite;


    constructor(x : number, y : number, textbox : TextBox) {

        super(x, y);

        this.textbox = textbox;

        this.spr = new Sprite(16, 16);

        this.hitbox = new Rectangle(0, 2, 12, 12);

        this.facePlayer = false;

        this.cameraCheckArea = new Vector(24, 24);

        this.inCamera = true;
    }


    protected generalPlayerEvent(player : Player, event : ProgramEvent) : void {
        
        this.activated = player.progress.getProperty("fans_active") == 1;
        this.spr.setFrame(Number(this.activated), 0);
    }


    protected activationEvent(player : Player, event : ProgramEvent): void {
        
        // event.audio.playSample(event.assets.getSample("select"), 0.60);

        player.progress.setProperty("fans_active", 1);

        this.textbox.addText(event.localization?.getItem("switch") ?? []);
        this.textbox.activate(false, (event : ProgramEvent) => event.audio.resumeMusic());
    }


    public draw(canvas : Canvas) : void {
        
        if (!this.exist || !this.inCamera)
            return;

        const bmp = canvas.getBitmap("switch");

        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y) - 8;

        this.spr.draw(canvas, bmp, dx, dy);
    }
}
