import { ProgramEvent } from "../core/event.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle } from "../math/rectangle.js";
import { GameObject } from "./gameobject.js";
import { Player } from "./player.js";


const AIRFLOW_HEIGHT : number = 40;


export class Fan extends GameObject {
    

    private spr : Sprite;

    private active : boolean = false;

    private flyBox : Rectangle;


    public readonly stageTileIndex : number;


    constructor(x : number, y : number, stageTileIndex : number) {

        super(x, y, true);

        this.spr = new Sprite(16, 16);

        this.inCamera = true;

        this.stageTileIndex = stageTileIndex;
    
        this.flyBox = new Rectangle(0, -AIRFLOW_HEIGHT/2, 12, AIRFLOW_HEIGHT);
    }


    protected updateEvent(event : ProgramEvent) : void {
        
        if (!this.active) {

            this.spr.setFrame(0, 0);
            return;
        }

        this.spr.animate(0, 0, 3, 3, event.tick);
    }


    public playerCollision(player : Player, event : ProgramEvent) : void {

        const FLY_SPEED : number = -0.25;
        const FLY_SPEED_MAX : number = -2.0;

        if (!player.isActive())
            return;

        this.active = player.progress.getProperty("fans_active") == 1;

        if (this.active && player.overlayRect(this.pos, this.flyBox)) {

            player.updateSpeedYAxis(FLY_SPEED, FLY_SPEED_MAX, event);
        }
    }   


    public draw(canvas: Canvas, bmp : Bitmap | undefined): void {
        
        if (!this.isActive())
            return;

        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y) - 8;

        this.spr.draw(canvas, bmp, dx, dy);

        let frame : number;
        if (this.active) {

            frame = this.spr.getColumn();
            for (let y = 0; y < 2; ++ y) {

                canvas.drawBitmap(bmp, Flip.None, dx, dy - y*16 - 12, frame*16, 16, 16, 16);
            }
        }
    }
}
