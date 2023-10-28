import { Sprite } from "../gfx/sprite.js";
import { Rectangle } from "../math/rectangle.js";
import { ProgramEvent } from "../core/event.js";
import { Player } from "./player.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";
import { TransitionType } from "../core/transition.js";
import { RGBA } from "../math/rgba.js";
import { ActivableObject } from "./activableobject.js";
import { Camera } from "./camera.js";
import { TextBox } from "../ui/textbox.js";
import { ProgressManager } from "./progress.js";


export class Door extends ActivableObject{


    private locked : boolean = false;


    private cb : ((event : ProgramEvent) => void) | undefined = undefined;

    private textbox : TextBox;


    constructor(x : number, y : number, 
        useCb : (event : ProgramEvent) => void,
        textbox : TextBox,
        locked : boolean = false) {

        super(x, y);

        this.hitbox = new Rectangle(0, 0, 12, 16);

        this.facePlayer = false;

        this.cameraCheckArea = new Vector(16, 16);

        this.cb = useCb;
        this.textbox = textbox;
    
        this.inCamera = true;

        this.locked = locked;
    }


    private handleLock(unlock : boolean, progress : ProgressManager, event : ProgramEvent) : void {

        if (unlock) {

            event.audio.playSample(event.assets.getSample("unlock"), 0.55);

            this.textbox.addText(event.localization?.getItem("unlock_door") ?? ["null"]);
            this.locked = false;

            progress.setProperty("door_unlocked", 1);
        }
        else {

            event.audio.playSample(event.assets.getSample("reject"), 0.55);
            this.textbox.addText(event.localization?.getItem("locked_door") ?? ["null"]);
        }

        this.textbox.activate();
    }


    protected activationEvent(player : Player, event : ProgramEvent, camera? : Camera): void {
    
        player.showActionIcon(-1);
        player.setPosition(this.pos.x, this.pos.y);
        player.setFrame(4, 2);

        if (this.locked) {

            this.handleLock(player.progress.getProperty("item4") == 1, player.progress, event);
            return;
        }

        event.audio.stopMusic();
        event.audio.playSample(event.assets.getSample("door"), 0.45);

        const ppos = player.getPosition();
        player.setCheckpoint(ppos.x, ppos.y);

        event.transition.activate(true, TransitionType.Circle, 1.0/30.0, event,
            (event : ProgramEvent) => this.cb?.(event), new RGBA(0, 0, 0));

        if (camera !== undefined) {

            event.transition.setCenter(
                new Vector(
                    ppos.x % camera.width,
                    ppos.y % camera.height
                )
            );
        }
    }


    public draw(canvas: Canvas) : void {
        
        if (!this.locked || !this.exist || !this.inCamera)
            return;

        const bmp = canvas.getBitmap("locked_door");

        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y) - 16;

        canvas.drawBitmap(bmp, Flip.None, dx, dy, 0, 0, 16, 24);
    }
}
