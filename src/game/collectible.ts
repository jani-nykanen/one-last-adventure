import { ProgramEvent } from "../core/event.js";
import { Rectangle } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { Camera } from "./camera.js";
import { CollisionObject } from "./collisionobject.js";
import { Sprite } from "../gfx/sprite.js";
import { Bitmap, Canvas } from "../gfx/interface.js";
import { Player } from "./player.js";


export const enum CollectibleType {

    Coin = 0,
    Heart = 1,
    MagicPotion = 2
}


export class Collectible extends CollisionObject {


    private type : CollectibleType = CollectibleType.Coin;

    private spr : Sprite;


    constructor() {

        super(0, 0, false);

        this.friction = new Vector(0.025, 0.10);
        this.bounceFactor = new Vector(0.75, 0.75);

        this.collisionBox = new Rectangle(0, 2, 8, 8);
        this.hitbox = new Rectangle(0, 0, 12, 12);

        this.spr = new Sprite(16, 16);
    }


    protected die(event : ProgramEvent) : boolean {

        const ANIM_SPEED : number = 4;

        this.spr.animate(this.type*2 + 1, 0, 4, ANIM_SPEED, event.tick);

        return this.spr.getColumn() == 4;
    }


    protected cameraEvent(enteredCamera : boolean, camera : Camera, event : ProgramEvent) : void {

        if (!enteredCamera) {

            this.exist = false;
        }
    }


    protected updateEvent(event : ProgramEvent) : void {
    
        const speed = 8 - Math.abs(this.speed.x);

        let start = 0;
        let end = 0;
        if (this.speed.x > 0) {

            end = 3;
        }
        else {

            start = 3;
        }

        this.spr.animate(this.type*2, start, end, speed, event.tick);
    }


    public spawn(x : number, y : number, speedx : number, speedy : number, type : CollectibleType) : void {

        const BASE_GRAVITY : number = 4.0;

        this.pos = new Vector(x, y);
        this.speed = new Vector(speedx, speedy);
    
        this.target.x = 0;
        this.target.y = BASE_GRAVITY;

        this.type = type;

        this.exist = true;
        this.inCamera = true;
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {
        
        if (!this.exist)
            return;

        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y) - 7;

        this.spr.draw(canvas, bmp, dx, dy);
    }


    public playerCollision(player : Player, event : ProgramEvent) : void {

        if (!this.isActive() || !player.isActive())
            return;

        if (player.overlay(this)) {

            this.dying = true;
            this.spr.setFrame(0, this.type*2 + 1);

            switch (this.type) {

            case CollectibleType.Coin:

                event.audio.playSample(event.assets.getSample("coin"), 0.70);
                player.addCoins(1);
                break;

            case CollectibleType.Heart:

                event.audio.playSample(event.assets.getSample("heal"), 0.60);
                player.recoverHealth(2);
                break;

            default:
                break;
            }
        }
    }
}
