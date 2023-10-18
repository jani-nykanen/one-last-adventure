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
import { Projectile } from "../projectile.js";
import { ProjectileGenerator } from "../projectilegenerator.js";


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

    // Don't ask why these are here, not inside the enemy classes
    // that *actually* use them. Stupid reasons.
    protected specialTimer : number = 0;
    protected specialActionActive : boolean = false;

    protected dir : number = 0;

    protected didTouchSurface : boolean = false;

    protected dropProbability : number = 0.50;

    protected checkVerticalCameraCollision : boolean = false;

    protected readonly messages : FlyingMessageGenerator;
    protected readonly collectibles : CollectibleGenerator;
    protected readonly projectiles : ProjectileGenerator;

    public readonly stageTileIndex : number;


    constructor(x : number, y : number, 
        stageTileIndex : number,
        messages : FlyingMessageGenerator,
        collectibles : CollectibleGenerator,
        projectiles : ProjectileGenerator) {

        super(x, y, true);

        this.stageTileIndex = stageTileIndex;

        this.messages = messages;
        this.collectibles = collectibles;
        this.projectiles = projectiles;

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


    private hurt(damage : number, player : Player, event : ProgramEvent) : void {

        const HURT_TIME : number = 30;

        if ((this.health -= damage) <= 0) {

            this.hurtTimer = 0;
            this.dying = true;

            event.audio.playSample(event.assets.getSample("kill"), 0.50);

            this.spr.setFrame(0, 0);

            this.collectibles.spawnWeighted(
                this.pos, 
                Vector.direction(player.getPosition(), this.pos),
                this.dropProbability,
                player.getHealthWeight(), player.getMagicWeight());

            return;
        }
        event.audio.playSample(event.assets.getSample("hit"), 0.60);

        this.hurtTimer = HURT_TIME;
    }


    protected updateAI?(event : ProgramEvent) : void;


    protected playerEvent?(player : Player, event : ProgramEvent) : void;


    protected die(event : ProgramEvent) : boolean {
        
        const DEATH_SPEED : number = 5;
        
        this.flip = Flip.None;
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

        this.didTouchSurface = this.touchSurface;
        this.touchSurface = false;
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
            
            this.hurt(damage, player, event);
            if (!player.downAttackBounce()) {

                this.speed.x = KNOCKBACK_SPEED*dir.x*this.weight;
            }

            this.messages.spawn(this.pos.x, this.pos.y - 6, -damage);
        }

        if (this.overlay(player)) {

            player.hurt(-dir.x, this.damage, event);
        }
    }


    public projectileCollision(o : Projectile, player : Player, event : ProgramEvent) : boolean {

        const KNOCKBACK_SPEED : number = 1.5;

        if (!o.isActive() || !this.isActive || !o.isFriendly())
            return false;

            
        if (o.overlay(this)) {

            o.kill(event);
            this.hurt(o.getDamage(), player, event);
            this.messages.spawn(this.pos.x, this.pos.y - 6, -o.getDamage());

            this.speed.x = -KNOCKBACK_SPEED*Math.sign(o.getPosition().x - this.pos.x)*this.weight;

            return true;
        }
        return false;
    }


    public enemyToEnemyCollision(o : Enemy, event : ProgramEvent) : boolean {

        const HIT_RADIUS : number = 8;

        if (!o.isActive() || !this.isActive)
            return false;

        const dist = Vector.distance(o.pos, this.pos);
        const dir = Vector.direction(o.pos, this.pos);

        // NOTE: Might result going through walls?
        if (dist < HIT_RADIUS) {

            this.pos.x += dir.x*(HIT_RADIUS - dist);
            this.pos.y += dir.y*(HIT_RADIUS - dist);

            o.pos.x -= dir.x*(HIT_RADIUS - dist);
            o.pos.x -= dir.y*(HIT_RADIUS - dist);

            return true;
        }
        return false;
    }


    public cameraCollision(camera : Camera, event : ProgramEvent): void {

        if (camera.isMoving())
            return;

        const cpos = camera.getTopCorner();

        // This is what I call a "hacky workaround"
        const collisionsDisabled = this.disableCollisions;
        this.disableCollisions = false;

        this.horizontalCollision(cpos.x, cpos.y, camera.height, -1 ,event);
        this.horizontalCollision(cpos.x + camera.width, cpos.y, camera.height, 1, event);

        if (this.checkVerticalCameraCollision) {

            this.verticalCollision(cpos.x, cpos.y, camera.width, -1, event);
            this.verticalCollision(cpos.x, cpos.y + camera.height, camera.width, 1, event);
        }

        this.disableCollisions = collisionsDisabled;
    }
    
}