import { ActivableObject } from "./activableobject.js";
import { TextBox } from "../ui/textbox.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle } from "../math/rectangle.js";
import { ProgramEvent } from "../core/event.js";
import { Player, SpecialPlayerAnimationType } from "./player.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";


const CHECKPOINT_FLY_TIME : number = 10;
const CHECKPOINT_WAIT_TIME : number = 40;


export class SavePoint extends ActivableObject {


    private spr : Sprite;
    private active : boolean = false;

    private dialogueCb : (event : ProgramEvent) => void;

    private floatTimer : number = 0.0;
    private shiftY : number = 0;

    private checkpointPos : number = 0;
    private checkpointTimer : number = 0;


    constructor(x : number, y : number, dialogueCb : (event : ProgramEvent) => void) {

        super(x, y);

        this.spr = new Sprite(16, 16);

        this.hitbox = new Rectangle(0, 0, 12, 16);

        this.facePlayer = false;

        this.cameraCheckArea = new Vector(24, 24);
        this.inCamera = true;

        this.dialogueCb = dialogueCb;
    }


    protected playerTouchEvent(player : Player, event : ProgramEvent, initial : boolean): void {

        if (!this.active) {

            if (!initial) {

                event.audio.playSample(event.assets.getSample("savepoint"), 0.50);

                this.shiftY = 0;
                this.floatTimer = 0.0;

                this.checkpointPos = 0;
                this.checkpointTimer = CHECKPOINT_FLY_TIME + CHECKPOINT_WAIT_TIME;
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

            this.floatTimer = 0.0;
            this.shiftY = 0;
        }
    }


    protected updateEvent(event : ProgramEvent): void {

        const ANIM_SPEED : number = 5;
        const FLOAT_SPEED : number = Math.PI*2/90;
        const SHIFT_SPEED : number = 5.0/60.0;
        const FLY_SHIFT : number = -5;

        if (this.active) {

            if (this.checkpointTimer > 0) {

                if (this.checkpointTimer >= CHECKPOINT_WAIT_TIME) {

                    this.checkpointPos -= 2*event.tick;
                }
                this.checkpointTimer -= event.tick;
            }

            if (this.shiftY > FLY_SHIFT) {

                this.shiftY = Math.max(FLY_SHIFT, this.shiftY - SHIFT_SPEED*event.tick);
            }
            else {

                this.floatTimer = (this.floatTimer + FLOAT_SPEED*event.tick) % (Math.PI*2);
            }

            this.spr.animate(0, 1, 8, ANIM_SPEED, event.tick);
            return;
        }
    }


    public draw(canvas : Canvas) : void {
        
        const FLOAT_AMPLITUDE : number = 2.0;

        if (!this.exist || !this.inCamera)
            return;

        const bmp = canvas.getBitmap("savepoint");

        const floatJump = Math.round(Math.sin(this.floatTimer)*FLOAT_AMPLITUDE);

        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y + this.shiftY + floatJump) - 6;

        this.spr.draw(canvas, bmp, dx, dy);
    }
    

    public postDraw(canvas : Canvas) : void {
        
        if (!this.exist || !this.inCamera)
            return;

        const bmp = canvas.getBitmap("savepoint");

        const dx = Math.round(this.pos.x) - 24;
        const dy = Math.round(this.pos.y + this.checkpointPos - 12);

        if (this.checkpointTimer > 0) {

            canvas.drawBitmap(bmp, Flip.None, dx, dy, 0, 16, 48, 8);
        }
    }
}
