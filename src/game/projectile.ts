import { ProgramEvent } from "../core/event.js";
import { Canvas, Bitmap, Flip } from "../gfx/interface.js";
import { Rectangle } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { Camera } from "./camera.js";
import { CollisionObject } from "./collisionobject.js"; 
import { Sprite } from "../gfx/sprite.js";


const DAMAGE : number[] = [2];


export class Projectile extends CollisionObject {


    private spr : Sprite;

    private friendly : boolean = false;
    private id : number = 0;

    private damage : number = 1;


    constructor() {

        super(0, 0, false);

        this.spr = new Sprite(16, 16);

        this.collisionBox = new Rectangle(0, 0, 4, 4);
        this.hitbox = new Rectangle(0, 0, 4, 4);
    }


    private kill(event : ProgramEvent) : void {

        if (this.dying)
            return;

        this.dying = true;
        this.spr.setFrame(4, this.id);

        event.audio.playSample(event.assets.getSample("magic_hit"), 0.60);
    }


    protected die(event: ProgramEvent) : boolean {

        const ANIM_SPEED : number = 4;

        this.spr.animate(this.id, 4, 8, ANIM_SPEED, event.tick);

        return this.spr.getColumn() >= 8;
    }


    protected cameraEvent(enteredCamera: boolean, camera: Camera, event: ProgramEvent): void {
        
        if (!this.inCamera) {

            this.exist = false;
            // console.log("Projectile destroyed");
        }
    }


    protected verticalCollisionEvent(dir : 1 | -1, event : ProgramEvent) : void {
        
        this.kill(event);
    }


    protected horizontalCollisionEvent(dir : 1 | -1, event : ProgramEvent): void {
        
        this.kill(event);
    }


    protected updateEvent(event : ProgramEvent): void {

        const LAST_FRAME : number[] = [2];
        const ANIM_SPEED : number[] = [4];

        this.spr.animate(this.id, 0, LAST_FRAME[this.id] ?? 3, ANIM_SPEED[this.id] ?? 4, event.tick);
    }


    public spawn(x : number, y : number, speedx : number, speedy : number, 
        id : number, friendly : boolean = true) : void {

        this.pos = new Vector(x, y);
        this.speed = new Vector(speedx, speedy);
    
        this.target.x = this.speed.x;
        this.target.y = 0;

        this.friendly = friendly;
        this.id = id;

        this.damage = DAMAGE[id] ?? 1;

        this.exist = true;
        this.inCamera = true;

        this.spr.setFrame(0, this.id);
    }


    public draw(canvas: Canvas, bmp : Bitmap | undefined): void {

        if (!this.exist || !this.inCamera)
            return;

        const dx = Math.round(this.pos.x) - this.spr.width/2;
        const dy = Math.round(this.pos.y) - this.spr.height/2;

        this.spr.draw(canvas, bmp, dx, dy, Flip.None);
    }


    public isFriendly = () : boolean => this.friendly;

    public getDamage = () : number => this.damage;
}
