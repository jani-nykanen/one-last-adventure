import { CollisionObject } from "../collisionobject.js";
import { Sprite } from "../../gfx/sprite.js";
import { Vector } from "../../math/vector.js";
import { Rectangle } from "../../math/rectangle.js";
import { ProgramEvent } from "../../core/event.js";
import { Player } from "../player.js";
import { FlyingMessageGenerator } from "../flyingmessagegenerator.js";
import { CollectibleGenerator } from "../collectiblegenerator.js";
import { Bitmap, Canvas, Flip } from "../../gfx/interface.js";
import { Camera } from "../camera.js";


export class Enemy extends CollisionObject {


    protected spr : Sprite;
    protected flip : Flip = Flip.None;

    protected damage : number = 2;

    protected health : number = 5;
    protected maxHealth : number = 5;

    protected swordHitId : number = -1;

    protected hurtTimer : number = 0;

    protected weight : number = 1.0;
    protected getGravity : boolean = true;


    protected readonly messages : FlyingMessageGenerator;
    protected readonly collectibles : CollectibleGenerator;

    public readonly stageTileIndex : number;


    constructor(x : number, y : number, 
        stageTileIndex : number,
        messages : FlyingMessageGenerator,
        collectibles : CollectibleGenerator) {

        super(x, y, true);

        this.stageTileIndex = stageTileIndex;

        this.messages = messages;
        this.collectibles = collectibles;

        this.spr = new Sprite(16, 16);

        // Default values, might be altered by the actual enemy objects
        this.friction = new Vector(0.15, 0.15);
        this.hitbox = new Rectangle(0, 2, 12, 12);
        this.collisionBox = new Rectangle(0, 3, 10, 10);

        this.cameraCheckArea = new Vector(24, 24);

        this.init?.();
        this.health = this.maxHealth;

        this.inCamera = true;
    }


    protected init?() : void;


    private hurt(damage : number, player : Player) : void {

        const HURT_TIME : number = 30;

        if ((this.health -= damage) <= 0) {

            this.hurtTimer = 0;
            this.dying = true;

            this.spr.setFrame(0, 0);

            this.collectibles.spawnWeighted(
                this.pos, 
                Vector.direction(player.getPosition(), this.pos),
                1.0 - player.getHealth()/player.getMaxHealth());

            return;
        }

        this.hurtTimer = HURT_TIME;
    }


    protected updateAI?(event : ProgramEvent) : void;


    protected playerEvent?(player : Player, event : ProgramEvent) : void;


    protected die(event : ProgramEvent) : boolean {
        
        const DEATH_SPEED : number = 5;

        this.spr.animate(0, 0, 4, DEATH_SPEED, event.tick);

        return this.spr.getColumn() == 4;
    }


    protected updateEvent(event : ProgramEvent) : void {
        
        const DEFAULT_GRAVITY : number = 4.0;

        if (this.hurtTimer > 0) {

            this.hurtTimer -= event.tick;
        }

        if (this.getGravity) {

            this.target.y = DEFAULT_GRAVITY;
        }

        this.updateAI?.(event);
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {

        if (!this.exist || !this.inCamera)
            return;

        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer/4) % 2 == 0)
            return;

        const dx = Math.round(this.pos.x) - this.spr.width/2;
        const dy = Math.round(this.pos.y) - this.spr.height/2 + 1;

        this.spr.draw(canvas, bmp, dx, dy, this.flip);
    }


    public playerCollision(player : Player, event : ProgramEvent) : void {

        const KNOCKBACK_SPEED : number = 2.5;

        if (!this.isActive() || !player.isActive())
            return;

        this.playerEvent?.(player, event);

        const dir = Vector.direction(player.getPosition(), this.pos);

        let damage : number;

        if (player.doesOverlaySword(this, this.swordHitId)) {

            damage = player.getDamage();

            this.swordHitId = player.getSwordHitID();
            
            this.hurt(damage, player);
            if (!player.downAttackBounce()) {

                this.speed.x = KNOCKBACK_SPEED*dir.x*this.weight;
            }

            this.messages.spawn(this.pos.x, this.pos.y - 6, -damage);
        }

        if (this.overlay(player)) {

            player.hurt(-dir.x, this.damage, event);
        }
    }


    public enemyToEnemyCollision(o : Enemy, event : ProgramEvent) : boolean {

        if (!o.isActive() || !this.isActive)
            return false;

        // TODO: Implement

        return false;
    }


    public cameraCollision(camera : Camera, event : ProgramEvent): void {

        if (camera.isMoving())
            return;

        const cpos = camera.getTopCorner();

        this.horizontalCollision(cpos.x, cpos.y, camera.height, -1 ,event);
        this.horizontalCollision(cpos.x + camera.width, cpos.y, camera.height, 1 ,event);
    }
    
}