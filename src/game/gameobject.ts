import { Rectangle } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { updateSpeedAxis } from "./utility.js";
import { Bitmap, Canvas } from "../gfx/interface.js";


export class GameObject {


    protected pos : Vector;
    protected speed : Vector;
    protected target : Vector;
    protected friction : Vector;

    protected hitbox : Rectangle;

    protected exist : boolean;
    protected dying = false;


    constructor(x : number = 0, y : number = 0, exist : boolean = false) {

        this.pos = new Vector(x, y);
        this.speed = new Vector();
        this.target = new Vector();
        this.friction = new Vector(1, 1);

        this.hitbox = new Rectangle();

        this.exist = exist;
    }


    protected updateEvent?(event : ProgramEvent) : void;
    protected die?(event : ProgramEvent) : boolean;


    protected updateMovement(event : ProgramEvent) : void {

        this.speed.x = updateSpeedAxis(this.speed.x, this.target.x, this.friction.x*event.tick);
        this.speed.y = updateSpeedAxis(this.speed.y, this.target.y, this.friction.y*event.tick);

        this.pos.x += this.speed.x*event.tick;
        this.pos.y += this.speed.y*event.tick;
    }


    public update(event : ProgramEvent) : void {

        if (!this.exist) {

            if (this.dying) {

                if (this.die?.(event) ?? true) {

                    this.exist = false;
                    this.dying = false;
                }
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
}