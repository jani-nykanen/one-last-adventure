import { Rectangle } from "../math/rectangle.js";
import { ProgramEvent } from "../core/event.js";
import { Player } from "./player.js";
import { Canvas, Flip } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";
import { TransitionType } from "../core/transition.js";
import { RGBA } from "../math/rgba.js";
import { ActivableObject } from "./activableobject.js";
import { Camera } from "./camera.js";
import { Sprite } from "../gfx/sprite.js";


export class Teleporter extends ActivableObject{


    private gridx : number;
    private gridy : number;
    private id : number;

    private spr : Sprite;


    private cb : ((x : number, y : number, id : number, event : ProgramEvent) => void) | undefined = undefined;


    constructor(x : number, y : number, 
        gridx : number, gridy : number, id : number,
        useCb : (x : number, y : number, id : number, event : ProgramEvent) => void) {

        super(x, y);

        this.gridx = gridx;
        this.gridy = gridy;
        this.id = id;

        this.hitbox = new Rectangle(0, 0, 12, 16);

        this.facePlayer = false;

        this.cameraCheckArea = new Vector(16, 16);

        this.cb = useCb;
        this.inCamera = true;

        this.spr = new Sprite(24, 32);

        this.activated = true;
    }


    protected updateEvent(event : ProgramEvent) : void {
        
        if (this.activated) {

            this.spr.setFrame(0, 0);
            return;
        }

        this.spr.animate(0, 1, 4, 2, event.tick);
    }


    protected generalPlayerEvent(player : Player, event : ProgramEvent) : void {
        
        this.activated = player.progress.getProperty("teleporters_active") == 0;
    }


    protected activationEvent(player : Player, event : ProgramEvent, camera? : Camera): void {
    

        player.showActionIcon(-1);
        player.setPosition(this.pos.x, this.pos.y);
        player.setFrame(4, 2);

        event.audio.pauseMusic();
        event.audio.playSample(event.assets.getSample("teleport"), 0.35);

        event.transition.activate(true, TransitionType.Waves, 1.0/120.0, event,
            (event : ProgramEvent) => this.cb?.(this.gridx, this.gridy, this.id, event), new RGBA(255, 255, 255));
    }


    public draw(canvas: Canvas) : void {
        
        if (!this.isActive())
            return;

        const bmp = canvas.getBitmap("teleporter");

        const dx = Math.round(this.pos.x) - 12;
        const dy = Math.round(this.pos.y) - 24;

        this.spr.draw(canvas, bmp, dx, dy);
    }
}
