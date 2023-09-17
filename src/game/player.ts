import { CollisionObject } from "./collisionobject.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas, Flip } from "../gfx/interface.js";
import { InputState } from "../core/inputstate.js";


export class Player extends CollisionObject {


    private jumpTimer : number = 0;
    private ledgeTimer : number = 0;

    private spr : Sprite;
    private flip : Flip = Flip.None;


    constructor(x : number = 0, y : number = 0) {

        super(x, y, true);

        this.hitbox = new Rectangle(0, 4, 8, 8);
        this.collisionBox = new Rectangle(0, 2, 8, 12);
        this.friction = new Vector(0.15, 0.15);

        this.spr = new Sprite(16, 16);
    } 


    private checkJump(event : ProgramEvent) : void {

        const JUMP_TIME = 12;

        const jumpButton = event.input.getAction("jump");

        if (this.ledgeTimer > 0 && 
            jumpButton == InputState.Pressed) {

            this.jumpTimer = JUMP_TIME;
            this.ledgeTimer = 0;
            this.touchSurface = false;
        }
        else if (this.jumpTimer > 0 &&
            (jumpButton & InputState.DownOrPressed) == 0) {

            this.jumpTimer = 0;
        }
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

        this.checkJump(event);
    }


    private animate(event : ProgramEvent) : void {

        // TODO: Split to smaller functions?

        const RUN_EPS = 0.01;
        const JUMP_EPS = 0.5;

        let animSpeed : number;
        let frame : number;

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
        // Jumping
        else {

            frame = 1;
            if (this.speed.y < -JUMP_EPS)
                frame = 0;
            else if (this.speed.y > JUMP_EPS)
                frame = 2;

            this.spr.setFrame(frame, 1);
        }
    }


    private updateTimers(event : ProgramEvent) : void {

        const JUMP_SPEED = -2.25;

        if (this.ledgeTimer > 0) {

            this.ledgeTimer -= event.tick;
        }

        if (this.jumpTimer > 0) {

            this.jumpTimer -= event.tick;
            this.speed.y = JUMP_SPEED;
            this.target.y = this.speed.y;
        }
    }


    protected verticalCollisionEvent(dir : -1 | 1, event: ProgramEvent): void {
        
        const LEDGE_TIME = 8;

        if (dir == 1) {
            
            this.ledgeTimer = LEDGE_TIME;
            return;
        }

        this.jumpTimer = 0;
    }


    protected updateEvent(event : ProgramEvent) : void {

        this.control(event);
        this.animate(event);
        this.updateTimers(event);
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