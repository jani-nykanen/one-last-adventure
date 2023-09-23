import { Rectangle, overlayRect } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { updateSpeedAxis } from "./utility.js";
import { Bitmap, Canvas } from "../gfx/interface.js";
import { ExistingObject } from "./existingobject.js";
import { Camera } from "./camera.js";


export class GameObject implements ExistingObject {


    protected pos : Vector;
    protected speed : Vector;
    protected target : Vector;
    protected friction : Vector;

    protected hitbox : Rectangle;

    protected exist : boolean;
    protected dying : boolean = false;
    protected inCamera : boolean = false;

    protected cameraCheckArea : Vector;


    constructor(x : number = 0, y : number = 0, exist : boolean = false) {

        this.pos = new Vector(x, y);
        this.speed = new Vector();
        this.target = new Vector();
        this.friction = new Vector(1, 1);

        this.hitbox = new Rectangle();

        this.cameraCheckArea = new Vector(16, 16);

        this.exist = exist;
    }


    protected updateEvent?(event : ProgramEvent) : void;
    protected die?(event : ProgramEvent) : boolean;

    protected cameraEvent?(enteredCamera : boolean, camera : Camera, event : ProgramEvent) : void;


    protected updateMovement(event : ProgramEvent) : void {

        this.speed.x = updateSpeedAxis(this.speed.x, this.target.x, this.friction.x*event.tick);
        this.speed.y = updateSpeedAxis(this.speed.y, this.target.y, this.friction.y*event.tick);

        this.pos.x += this.speed.x*event.tick;
        this.pos.y += this.speed.y*event.tick;
    }


    public update(event : ProgramEvent) : void {

        if (!this.exist) 
            return;

        if (!this.inCamera) {

            if (this.dying) {

                this.dying = false;
                this.exist = false;
            }
            return;
        }

        if (this.dying) {

            if (this.die?.(event) ?? true) {

                this.exist = false;
                this.dying = false;
            }
            return;
        }

        this.updateEvent?.(event);
        this.updateMovement(event);
    }


    public doesExist = () : boolean => this.exist;
    public isDying = () : boolean => this.dying;


    public forceKill() : void {

        this.exist = false;
        this.dying = false;
    }


    public draw?(canvas : Canvas, bmp? : Bitmap) : void;


    public cameraCheck(camera : Camera, event : ProgramEvent) : void {

        if (!this.exist) 
            return;
        
        const wasInCamera = this.inCamera;

        this.inCamera = camera.isObjectInCamera(this.pos, this.cameraCheckArea);
        if (this.inCamera != wasInCamera) {

            this.cameraEvent?.(this.inCamera, camera, event);
        }

        if (this.dying && !this.inCamera) {

            this.exist = false;
        }
    }


    public getPosition = () : Vector => this.pos.clone();


    public isInCamera = () : boolean => this.inCamera;


    public isActive = () : boolean => this.exist && !this.dying && this.inCamera;


    public overlayRect = (shift : Vector, hitbox : Rectangle) : boolean => overlayRect(this.pos, this.hitbox, shift, hitbox);
    public overlay = (o : GameObject) : boolean => overlayRect(this.pos, this.hitbox, o.pos, o.hitbox);
}
