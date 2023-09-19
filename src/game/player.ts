import { CollisionObject } from "./collisionobject.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle, overlayRect } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Canvas, Flip } from "../gfx/interface.js";
import { InputState } from "../core/inputstate.js";
import { Camera } from "./camera.js";


export class Player extends CollisionObject {


    private jumpTimer : number = 0;
    private ledgeTimer : number = 0;

    private touchLadder : boolean = false;
    private climbing : boolean = false;
    private touchLadderTop : boolean = false;
    private ladderX : number = 0;

    private attacking : boolean = false;

    private spr : Sprite;
    private sprWeapon : Sprite;
    private flip : Flip = Flip.None;


    constructor(x : number = 0, y : number = 0) {

        super(x, y, true);

        this.hitbox = new Rectangle(0, 4, 8, 8);
        this.collisionBox = new Rectangle(0, 2, 8, 12);
        this.friction = new Vector(0.15, 0.15);

        this.spr = new Sprite(16, 16);
        this.sprWeapon = new Sprite(32, 32);
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


    private startClimbing(event : ProgramEvent) : boolean {

        const SHIFT_DOWN : number = 8;

        if (this.climbing)
            return false;

        if ( (this.touchLadder && !this.touchLadderTop && event.input.upPress()) ||
             (!this.touchLadder && this.touchLadderTop && event.input.downPress())) {

            this.climbing = true;
            this.speed.zeros();
            this.target.zeros();

            this.pos.x = this.ladderX;

            if (this.touchLadderTop) {

                this.touchLadder = true;
                this.pos.y += SHIFT_DOWN;
            }
            return true;
        }
        return false;
    }


    private updateClimbing(event : ProgramEvent) : boolean {

        const CLIMB_SPEED : number = 0.75;
        const CLIMB_JUMP_TIME : number = 8;
        const JUMP_STICK_EPS = 0.05;

        if (!this.climbing)
            return false;

        if (this.climbing && !this.touchLadder) {

            this.climbing = false;
            return false;
        }

        const stick = event.input.stick;

        if (event.input.getAction("jump") == InputState.Pressed) {

            this.climbing = false;
            if (stick.y < JUMP_STICK_EPS) {

                this.jumpTimer = CLIMB_JUMP_TIME;
            }

            return;
        }

        this.speed.x = 0;
        this.target.x = 0;

        this.target.y = CLIMB_SPEED*stick.y;

        return true;
    }


    private attack(event : ProgramEvent) : void {

        if (this.attacking)
            return;

        if (event.input.getAction("attack") == InputState.Pressed) {

            this.attacking = true;
            this.spr.setFrame(0, 2);
            this.sprWeapon.setFrame(0, 0);
        }
    }


    private updateAttacking(event : ProgramEvent) : boolean {

        const FRAME_TIME : number = 4;

        if (!this.attacking)
            return false;

        if (this.touchSurface) {

            this.target.x = 0.0;
        }

        if (this.climbing) {

            this.target.y = 0.0;
        }

        this.sprWeapon.animate(0, 0, 5, FRAME_TIME, event.tick);
        this.spr.animate(2, 0, 3, 
            this.spr.getColumn() == 2 ? (FRAME_TIME*3) : FRAME_TIME, 
            event.tick);
        if (this.spr.getColumn() == 3) {

            this.spr.setFrame(2, 2);
            this.attacking = false;
            return false;
        }
        return true;
    }


    private control(event : ProgramEvent) : void {

        const BASE_GRAVITY = 4.0;
        const WALK_SPEED = 1.0;
        const EPS = 0.1;

        if (!this.climbing) {

            this.target.y = BASE_GRAVITY;
        }

        this.attack(event);
        if (this.updateAttacking(event)) {

            return;
        }

        const stick = event.input.stick;
        if (Math.abs(stick.x) >= EPS) {

            this.flip = stick.x > 0 ? Flip.None : Flip.Horizontal;
        }

        this.startClimbing(event);
        if (this.updateClimbing(event)) {

            return;
        }

        this.target.x = WALK_SPEED*stick.x;

        this.checkJump(event);
    }


    private animate(event : ProgramEvent) : void {

        // TODO: Split to smaller functions?

        const ANIM_EPS = 0.01;
        const JUMP_EPS = 0.5;

        let animSpeed : number;
        let frame : number;

        if (this.attacking)
            return;

        // Climbing
        if (this.climbing) {

            if (Math.abs(this.target.y) < ANIM_EPS &&
                Math.abs(this.target.y) < ANIM_EPS) {

                this.spr.setFrame(4, 1);
                return;
            }

            this.spr.animate(1, 3, 6, 6, event.tick);
            return;
        }

        // Running
        if (this.touchSurface) {

            if (Math.abs(this.speed.x) < ANIM_EPS &&
                Math.abs(this.target.x) < ANIM_EPS) {

                this.spr.setFrame(0, 0);
                return;
            }

            animSpeed = Math.round(10 - Math.abs(this.speed.x)*5);

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


    private updateFlags() : void {

        this.touchLadder = false;
        this.touchLadderTop = false;
    }


    protected verticalCollisionEvent(dir : -1 | 1, event : ProgramEvent) : void {
        
        const LEDGE_TIME = 8;

        if (dir == 1) {
            
            this.ledgeTimer = LEDGE_TIME;
            this.climbing = false;
            return;
        }

        this.jumpTimer = 0;
    }


    public ladderCollision(x : number, y : number, w : number, h : number, 
        ladderTop : boolean, event : ProgramEvent) : boolean {

        if (!this.exist || this.dying)
            return false;

        if (overlayRect(this.pos, this.collisionBox, new Vector(), new Rectangle(x + w/2, y + h/2, w, h))) {

            this.touchLadder ||= !ladderTop;
            this.touchLadderTop ||= ladderTop;

            this.ladderX = x + w/2;

            return true;
        }
        return false;
    }


    protected updateEvent(event : ProgramEvent) : void {

        this.control(event);
        this.animate(event);
        this.updateTimers(event);
        this.updateFlags();
    }   


    public draw(canvas : Canvas) : void {

        const WEAPON_XOFF : number[] = [2, -18];

        if (!this.exist)
            return;

        const bmp = canvas.getBitmap("player");
        const bmpWeapons = canvas.getBitmap("weapons");

        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y) - 7;

        const flip = (this.climbing && !this.attacking) ? Flip.None : this.flip;

        this.spr.draw(canvas, bmp, dx, dy, flip);

        if (this.attacking && this.sprWeapon.getColumn() < 5) {

            this.sprWeapon.draw(canvas, bmpWeapons, dx + WEAPON_XOFF[flip], dy - 8, flip);
        }
    }


    public cameraCollision(camera : Camera | undefined, event : ProgramEvent) : void {

        const CAMERA_MOVE_SPEED = 1.0/20.0;

        const H_MARGIN = 8;
        const V_MARGIN = 6;

        const SPEED_X = 1.0;
        const SPEED_Y = SPEED_X*(event.screenHeight/event.screenWidth);

        let dir : Vector;

        if (camera === undefined)
            return;

        if (camera.isMoving()) {

            dir = camera.moveDirection();

            this.pos.x += dir.x*SPEED_X*event.tick;
            this.pos.y += dir.y*SPEED_Y*event.tick;
            
            return;
        }

        let dx : number = 0;
        let dy : number = 0;

        const topCorner = camera.getTopCorner();

        const left = topCorner.x;
        const top = topCorner.y;
        const right = left + camera.width;
        const bottom = top + camera.height;

        if (this.speed.x > 0 && this.pos.x + H_MARGIN >= right) {

            dx = 1;
        }
        else if (this.speed.x < 0 && this.pos.x - H_MARGIN <= left) {

            dx = -1;
        }
        else if (this.speed.y > 0 && this.pos.y + V_MARGIN >= bottom) {

            dy = 1;
        }
        else if (this.speed.y <0 && this.pos.y - V_MARGIN <= top) {

            dy = -1;
        }

        if (dx != 0 || dy != 0) {

            if (!camera.move(dx, dy, CAMERA_MOVE_SPEED)) {

                return;
            }

            if (dx != 0) {

                this.speed.y = 0;
                this.jumpTimer = 0;
            }
            else if (dy != 0) {

                this.speed.x = 0;
            }
        }
    }
}