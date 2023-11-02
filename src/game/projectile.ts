import { ProgramEvent } from "../core/event.js";
import { Canvas, Bitmap, Flip } from "../gfx/interface.js";
import { Rectangle } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { Camera } from "./camera.js";
import { CollisionObject } from "./collisionobject.js"; 
import { Sprite } from "../gfx/sprite.js";


// const DAMAGE : number[] = [2];


const PROJECTILE_WIDTH : number[] = [10, 6, 8, 8];
const PROJECTILE_HEIGHT : number[] = [10, 6, 8, 8];


export class Projectile extends CollisionObject {


    private spr : Sprite;

    private friendly : boolean = false;
    private id : number = 0;

    private damage : number = 1;


    constructor() {

        super(0, 0, false);

        this.spr = new Sprite(16, 16);

        this.collisionBox = new Rectangle(0, 0, 4, 4);

        // TODO: Different hitbox for different types of projectiles!
        this.hitbox = new Rectangle(0, 0, 8, 8);

        this.friction.x = 0.10;
        this.friction.y = 0.10;
    }


    protected die(event: ProgramEvent) : boolean {

        const ANIM_SPEED : number = 4;

        this.spr.animate(this.id, 4, 8, ANIM_SPEED, event.tick);

        return this.spr.getColumn() >= 8;
    }


    protected cameraEvent(enteredCamera: boolean, camera: Camera, event: ProgramEvent): void {
        
        if (!this.inCamera) {

            this.exist = false;
        }
    }


    protected verticalCollisionEvent(dir : 1 | -1, event : ProgramEvent) : void {
        
        this.kill(event);
    }


    protected horizontalCollisionEvent(dir : 1 | -1, event : ProgramEvent): void {
        
        this.kill(event);
    }


    protected updateEvent(event : ProgramEvent): void {

        const LAST_FRAME : number[] = [2, 3, 2];
        const ANIM_SPEED : number[] = [4, 5, 4];

        if (this.id == 3)
            return;

        this.spr.animate(this.id, 0, LAST_FRAME[this.id] ?? 3, ANIM_SPEED[this.id] ?? 4, event.tick);
    }


    public spawn(x : number, y : number, speedx : number, speedy : number, 
        id : number, damage : number, friendly : boolean = true,
        getGravity : boolean = false, getCollisions : boolean = true) : void {

        const BASE_GRAVITY : number = 4.0;

        this.pos = new Vector(x, y);
        this.speed = new Vector(speedx, speedy);
    
        this.target.x = this.speed.x;
        this.target.y = this.speed.y;

        this.friendly = friendly;
        this.id = id;

        this.damage = damage; // DAMAGE[id] ?? 1;

        this.exist = true;
        this.inCamera = true;

        this.spr.setFrame(0, this.id);
        if (this.id == 3) {

            this.spr.setFrame((Math.random()*4) | 0, this.id);
        }

        this.hitbox.w = PROJECTILE_WIDTH[this.id] ?? 8;
        this.hitbox.h = PROJECTILE_HEIGHT[this.id] ?? 8;

        if (getGravity) {

            this.target.y = BASE_GRAVITY;
        }

        this.disableCollisions = !getCollisions;
    }


    public draw(canvas: Canvas, bmp : Bitmap | undefined): void {

        if (!this.exist || !this.inCamera)
            return;

        const dx = Math.round(this.pos.x) - this.spr.width/2;
        const dy = Math.round(this.pos.y) - this.spr.height/2;

        const flip = this.dying || this.speed.x < 0 ? Flip.None : Flip.Horizontal;

        this.spr.draw(canvas, bmp, dx, dy, flip);
    }


    public kill(event : ProgramEvent) : void {

        if (this.dying)
            return;

        this.dying = true;
        this.spr.setFrame(4, this.id);

        event.audio.playSample(event.assets.getSample("magic_hit"), 0.50);
    }


    public isFriendly = () : boolean => this.friendly;

    public getDamage = () : number => this.damage;
}
