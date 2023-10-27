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
import { REQUIRED_GEM_COUNT } from "./gemcount.js";


export class GiantDoor extends ActivableObject{


    private locked : boolean = false;
    private gemCount : number = 0;


    private cb : ((event : ProgramEvent) => void) | undefined = undefined;

    private textbox : TextBox;


    constructor(x : number, y : number, 
        useCb : ((event : ProgramEvent) => void) | undefined,
        textbox : TextBox,
        progress : ProgressManager) {

        super(x, y);

        this.hitbox = new Rectangle(0, 0, 16, 16);

        this.facePlayer = false;

        this.cameraCheckArea = new Vector(48, 32);

        this.cb = useCb;
        this.textbox = textbox;
    
        this.inCamera = true;

        this.gemCount = progress.getProperty("gems");
        this.locked = this.gemCount < REQUIRED_GEM_COUNT;
    }


    protected generalPlayerEvent(player : Player, event : ProgramEvent): void {
        
        this.gemCount = player.progress.getProperty("gems");
        this.locked = this.gemCount < REQUIRED_GEM_COUNT;
    }


    protected activationEvent(player : Player, event : ProgramEvent, camera? : Camera): void {
    
        player.showActionIcon(-1);

        if (this.locked) {

            event.audio.playSample(event.assets.getSample("reject"), 0.55);
            this.textbox.addText(event.localization?.getItem("locked_giant_door") ?? ["null"]);

            this.textbox.activate();

            return;
        }

        player.setPosition(this.pos.x, this.pos.y);
        player.setFrame(4, 2);

        event.audio.stopMusic();
        event.audio.playSample(event.assets.getSample("door"), 0.45);

        /*
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
        */
    }


    public draw(canvas: Canvas) : void {
        
        if (!this.exist || !this.inCamera)
            return;

        const bmp = canvas.getBitmap("locked_door");

        const dx = Math.round(this.pos.x) - 12;
        const dy = Math.round(this.pos.y) - 24;

        // Gems
        let shifty : number;
        let sy : number;
        // NOTE: This only works for fixed gem count...
        for (let i = 0; i < REQUIRED_GEM_COUNT; ++ i) {

            shifty = 0;
            if (i == 1 || i == 2)
                shifty = -8;
            
            sy = 0;
            if (i < this.gemCount)
                sy = 12;

            canvas.drawBitmap(bmp, Flip.None, dx - 23 + 19*i, dy - 12 + shifty, 40, sy, 12, 12);
        }

        if (!this.locked)
            return;

        canvas.drawBitmap(bmp, Flip.None, dx, dy, 16, 0, 24, 32);
    }
}
