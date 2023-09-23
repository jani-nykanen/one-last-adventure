import { ProgramEvent } from "../core/event.js";
import { Canvas, Bitmap, Flip } from "../gfx/interface.js";
import { Rectangle } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { Camera } from "./camera.js";
import { CollisionObject } from "./collisionobject.js"; 


export class Particle extends CollisionObject {


    private id : number = 0;
    private lifeTimer : number = 0;

    
    constructor() {

        super(0, 0, false);
    
        this.friction = new Vector(0.015, 0.10);
        this.collisionBox = new Rectangle(0, 0, 6, 6);

        this.bounceFactor = new Vector(0.90, 0.5);
    }


    protected cameraEvent(enteredCamera : boolean, camera : Camera, event : ProgramEvent) : void {

        if (!enteredCamera) {

            this.exist = false;
        }
    }


    protected updateEvent(event : ProgramEvent) : void {
        
        if ((this.lifeTimer -= event.tick) <= 0) {

            this.exist = false;
        }
    }


    public spawn(x : number, y : number, speedx : number, speedy : number, id : number) : void {

        const DEFAULT_LIFETIME : number = 180;
        const BASE_GRAVITY : number = 4.0;

        this.pos = new Vector(x, y);
        this.speed = new Vector(speedx, speedy);
    
        this.target.x = 0;
        this.target.y = BASE_GRAVITY;

        this.id = id;

        this.exist = true;
        this.inCamera = true;

        this.lifeTimer = DEFAULT_LIFETIME;
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {
        
        if (!this.exist)
            return;

        const dx = Math.round(this.pos.x) - 4;
        const dy = Math.round(this.pos.y) - 4;

        canvas.drawBitmap(bmp, Flip.None, dx, dy, this.id*8, 0, 8, 8);
    }
}
