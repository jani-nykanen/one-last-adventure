import { CollisionObject } from "./collisionobject.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas, Flip } from "../gfx/interface.js";


export class Player extends CollisionObject {


    private spr : Sprite;
    private flip : Flip = Flip.None;


    constructor(x : number = 0, y : number = 0) {

        super(x, y, true);

        this.hitbox = new Rectangle(0, 4, 8, 8);
        this.collisionBox = new Rectangle(0, 2, 8, 12);
        this.friction = new Vector(0.15, 0.15);

        this.spr = new Sprite(16, 16);
    } 


    private control(event : ProgramEvent) : void {

        const BASE_GRAVITY = 4.0;
        const WALK_SPEED = 1.5;
        const EPS = 0.1;

        const stick = event.input.stick;

        this.target.x = WALK_SPEED*stick.x;
        this.target.y = BASE_GRAVITY;

        if (Math.abs(stick.x) >= EPS) {

            this.flip = stick.x > 0 ? Flip.None : Flip.Horizontal;
        }
    }


    private animate(event : ProgramEvent) : void {

        const RUN_EPS = 0.01;


        let animSpeed : number;

        // Running
        if (this.touchSurface) {

            if (Math.abs(this.speed.x) < RUN_EPS &&
                Math.abs(this.target.x) < RUN_EPS) {

                this.spr.setFrame(0, 0);
                return;
            }

            animSpeed = Math.round(12 - Math.abs(this.speed.x)*4);

            this.spr.animate(0, 1, 6, animSpeed, event.tick);
        }
    }


    protected updateEvent(event : ProgramEvent) : void {

        this.control(event);
        this.animate(event);
    }   


    public draw(canvas : Canvas) : void {

        if (!this.exist)
            return;

        const bmp = canvas.getBitmap("player");

        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y) - 7;

        this.spr.draw(canvas, bmp, dx, dy, this.flip);
    }
}