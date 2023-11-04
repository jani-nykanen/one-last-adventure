import { CollisionObject } from "./collisionobject.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle, overlayRect } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { InputState } from "../core/inputstate.js";
import { Camera } from "./camera.js";
import { GameObject } from "./gameobject.js";
import { ProgressManager } from "./progress.js";
import { FlyingMessageGenerator } from "./flyingmessagegenerator.js";
import { FlyingMessageSymbol } from "./flyingmessage.js";
import { RGBA } from "../math/rgba.js";
import { ProjectileGenerator } from "./projectilegenerator.js";
import { Projectile } from "./projectile.js";


const DEATH_TIME : number = 60;

const JUMP_VOLUME : number = 0.60;


export const enum SpecialPlayerAnimationType {

    None = 0,
    HoldItem = 1,
    Use = 2,
    Frozen = 3,
};


export class Player extends CollisionObject {


    private jumpTimer : number = 0;
    private ledgeTimer : number = 0;
    private canDoubleJump : boolean = false;
    private doubleJumping : boolean = false;

    private touchLadder : boolean = false;
    private climbing : boolean = false;
    private touchLadderTop : boolean = false;
    private ladderX : number = 0;

    private attacking : boolean = false;
    private usingMagic : boolean = false;
    private downAttacking : boolean = false;
    private downAttackWait : number = 0;

    private spr : Sprite;
    private sprWeapon : Sprite;
    private sprIcon : Sprite;
    private flip : Flip = Flip.None;
    private dir : -1 | 1 = 1;

    private showIcon : boolean = false;
    private iconID : number = 0;

    private swordHitId : number = 0;
    private swordHitArea : Rectangle;

    private hurtTimer : number = 0;
    private knockbackTimer : number = 0;

    private health : number;
    private maxHealth : number; 

    private magic : number;
    private maxMagic : number;

    private attackPower : number = 3;
    private attackSpeed : number = 1;
    private armor : number = 0;
    private magicPower : number = 2;
    private runSpeed : number = 1.0;

    private deathTimer : number = 0;

    private activeSavepoint : GameObject | undefined = undefined;

    private specialAnimationType : SpecialPlayerAnimationType = SpecialPlayerAnimationType.None;
    private specialAnimationTimer : number = 0;
    private specialAnimationParam : number = 0;
    private showObtainedItem : boolean = false;
    private specialAnimationCallback : ((event : ProgramEvent) => void) | undefined = undefined;;


    private readonly flyingMessages : FlyingMessageGenerator;
    private readonly projectiles : ProjectileGenerator;

    public readonly progress : ProgressManager;


    constructor(x : number, y : number, 
        progress : ProgressManager, 
        flyingMessages : FlyingMessageGenerator,
        projectiles : ProjectileGenerator) {

        super(x, y, true);

        this.hitbox = new Rectangle(0, 0, 10, 10);
        this.collisionBox = new Rectangle(0, 2, 8, 12);
        this.friction = new Vector(0.15, 0.15);

        this.swordHitArea = new Rectangle();

        this.spr = new Sprite(16, 16);
        this.sprWeapon = new Sprite(32, 32);
        this.sprIcon = new Sprite(16, 16);
        this.sprIcon.setFrame(0, 4);

        this.inCamera = true;

        this.flyingMessages = flyingMessages;
        this.projectiles = projectiles;
        this.progress = progress;

        this.maxHealth = 5 ; //this.progress.getProperty("maxHealth", 5);
        this.maxMagic = 3; // this.progress.getProperty("maxMagic", 3.0);
            
        this.computeStats();
        this.health = this.maxHealth;
        this.magic = this.maxMagic;

        progress.setProperty("checkpointx", x);
        progress.setProperty("checkpointy", y);

        this.spr.setFrame(4, 3);
    } 


    private checkJump(event : ProgramEvent) : void {

        const JUMP_TIME : number = 12;
        const DOUBLE_JUMP_TIME : number = 4;

        const jumpButton = event.input.getAction("jump");

        if ((this.ledgeTimer > 0 || this.canDoubleJump) && 
            jumpButton == InputState.Pressed) {

            this.jumpTimer = this.ledgeTimer > 0 ? JUMP_TIME : DOUBLE_JUMP_TIME;
            
            this.doubleJumping = this.ledgeTimer <= 0;
            this.canDoubleJump &&= !this.doubleJumping;
            
            this.ledgeTimer = 0;
            this.touchSurface = false;

            event.audio.playSample(event.assets.getSample("jump"), JUMP_VOLUME);
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

            event.audio.playSample(event.assets.getSample("climb"), 0.60);

            this.spr.setFrame(4, 1);

            if (this.touchLadderTop) {

                this.touchLadder = true;
                this.pos.y += SHIFT_DOWN;
                this.oldPos.y += SHIFT_DOWN;
            }
            return true;
        }
        return false;
    }


    private updateClimbing(event : ProgramEvent) : boolean {

        const CLIMB_SPEED : number = 0.75;
        const CLIMB_JUMP_TIME : number = 8;
        const JUMP_STICK_EPS : number = 0.05;

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
            event.audio.playSample(event.assets.getSample("jump"), JUMP_VOLUME);

            this.doubleJumping = false;
            this.canDoubleJump = this.progress.getProperty("item6") == 1;
            return;
        }

        this.speed.x = 0;
        this.target.x = 0;

        this.target.y = CLIMB_SPEED*stick.y;

        return true;
    }


    private castSpell(event : ProgramEvent) : void {

        const SPELL_SPEED : number = 3;

        const dx = this.pos.x + this.dir*4;
        const dy = this.pos.y + 2;

        const p = this.projectiles.spawn(dx, dy, SPELL_SPEED*this.dir, 0, 0, this.magicPower, true);
        p.setOldPos(this.pos.y, dy);

        event.audio.playSample(event.assets.getSample("magic"), 0.50);
    }


    private attack(event : ProgramEvent) : void {

        const EPS : number = 0.25;
        const DOWN_ATTACK_JUMP : number = -1.0;

        if (this.attacking)
            return;

        const hasSword = this.progress.getProperty("item1") === 1;
        const hasMagic = this.progress.getProperty("item2") === 1;
        if (!hasSword && !hasMagic)
            return;

        const swordButtonDown = event.input.getAction("attack") == InputState.Pressed;
        const magicButtonDown = event.input.getAction("magic") == InputState.Pressed;

        const weaponRow = this.progress.getProperty("item5") == 1 ? 1 : 0;

        if ((hasSword && swordButtonDown) || (hasMagic && magicButtonDown)) {

            this.usingMagic = false;

            if (swordButtonDown &&
                !this.climbing &&
                !this.touchSurface &&
                event.input.stick.y > EPS) {

                this.downAttacking = true;
                this.downAttackWait = 0;

                this.speed.y = DOWN_ATTACK_JUMP;

                // Required to get the sword hitbox right
                this.updateDownAttack();
            }
            else {

                this.usingMagic = magicButtonDown && !swordButtonDown;
                if (this.usingMagic && this.magic < 1.0) {

                    event.audio.playSample(event.assets.getSample("reject"), 0.60);
                    return;
                }

                this.attacking = true;
                
                this.spr.setFrame(0, 2);
                this.sprWeapon.setFrame(0, weaponRow);
            }

            if (this.usingMagic) {

                this.magic -= 1.0;
                this.castSpell(event);
            }
            else {

                ++ this.swordHitId;
                event.audio.playSample(event.assets.getSample("sword"), 0.60);
            }
        }
    }


    private updateAttacking(event : ProgramEvent) : boolean {

        const SWORDHIT_WIDTH = [16, 18];
        const SWORDHIT_HEIGHT = [18, 22];

        const FRAME_TIME : number = 4;

        if (!this.attacking)
            return false;

        if (this.touchSurface) {

            this.target.x = 0.0;
        }

        if (this.climbing) {

            this.target.y = 0.0;
        }

        const frameTime = (FRAME_TIME + 1) - this.attackSpeed;

        this.sprWeapon.animate(this.sprWeapon.getRow(), 0, 5, frameTime, event.tick);
        this.spr.animate(2, 0, 3, 
            this.spr.getColumn() == 2 ? (frameTime*3) : frameTime, 
            event.tick);
        if (this.spr.getColumn() == 3) {

            this.spr.setFrame(2, 2);
            this.attacking = false;
            return false;
        }

        const swordType = Number(this.progress.getProperty("item5"));

        this.swordHitArea.x = this.pos.x + SWORDHIT_WIDTH[swordType]*this.dir;
        this.swordHitArea.y = this.pos.y;
        this.swordHitArea.w = SWORDHIT_WIDTH[swordType];
        this.swordHitArea.h = SWORDHIT_HEIGHT[swordType];

        return true;
    }


    private updateDownAttack() : void {

        const SWORDHIT_WIDTH : number = 8;
        const SWORDHIT_HEIGHT : number = 14;

        const DOWN_ATTACK_FRICTION : number = 0.50;
        const DOWN_ATTACK_GRAVITY : number = 8.0;

        this.target.x = 0;
        this.speed.x = 0;

        this.target.y = DOWN_ATTACK_GRAVITY;
        this.friction.y = DOWN_ATTACK_FRICTION;

        this.swordHitArea.x = this.pos.x;
        this.swordHitArea.y = this.pos.y + 12;
        this.swordHitArea.w = SWORDHIT_WIDTH;
        this.swordHitArea.h = SWORDHIT_HEIGHT;
    }


    private control(event : ProgramEvent) : void {

        const BASE_GRAVITY = 4.0;
        const WALK_SPEED = 1.0;
        const EPS = 0.1;
        const BASE_FRICTION = 0.15;

        if (this.knockbackTimer > 0) {

            this.target.x = 0;
            this.target.y = BASE_GRAVITY;
            return;
        }

        if (this.downAttackWait > 0) {

            this.speed.x = 0;
            return;
        }

        this.friction.y = BASE_FRICTION;
        if (this.downAttacking) {

            this.updateDownAttack();
            return;
        }

        if (!this.climbing) {

            this.target.y = BASE_GRAVITY;
        }

        const stick = event.input.stick;

        this.attack(event);
        if (this.updateAttacking(event)) {

            // If on air, still update the movement, but not the facing direction
            if (!this.touchSurface && !this.climbing) {
                
                this.target.x = WALK_SPEED*stick.x*this.runSpeed;
            }
            return;
        }
        
        if (Math.abs(stick.x) >= EPS) {

            this.flip = stick.x > 0 ? Flip.None : Flip.Horizontal;
            this.dir = stick.x > 0 ? 1 : -1;
        }

        const wasClimbing = this.climbing;

        this.startClimbing(event);
        if (this.updateClimbing(event)) {

            return;
        }

        this.target.x = WALK_SPEED*stick.x*this.runSpeed;

        if (!wasClimbing) {
        
            this.checkJump(event);
        }
    }


    private animate(event : ProgramEvent) : void {

        // TODO: Split to smaller functions?

        const ANIM_EPS = 0.01;
        const JUMP_EPS = 0.5;
        const ICON_ANIM_SPEED : number = 20;
        const DOUBLE_JUMP_ANIM_EPS : number = 0.5;

        if (this.showIcon) {

            this.sprIcon.animate(4, this.iconID*2, this.iconID*2 + 1, ICON_ANIM_SPEED, event.tick);
        }

        if (this.knockbackTimer > 0) {

            this.spr.setFrame(0, 3);
            return;
        }

        let animSpeed : number;
        let frame : number;

        if (this.attacking)
            return;

        // Climbing
        const oldFrame = this.spr.getColumn();
        if (this.climbing) {

            if (Math.abs(this.target.y) < ANIM_EPS &&
                Math.abs(this.target.y) < ANIM_EPS) {

                this.spr.setFrame(4, 1);
                return;
            }

            this.spr.animate(1, 3, 6, 6, event.tick);
            if (this.spr.getColumn() != oldFrame && oldFrame == 3) {

                event.audio.playSample(event.assets.getSample("climb"), 0.60);
            }

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

            if (this.doubleJumping && 
                this.speed.y < DOUBLE_JUMP_ANIM_EPS) {

                this.spr.animate(5, 0, 3, 4, event.tick);
                return;
            }

            frame = 1;
            if (this.speed.y < -JUMP_EPS)
                frame = 0;
            else if (this.speed.y > JUMP_EPS)
                frame = 2;

            this.spr.setFrame(frame, 1);
        }
    }


    private updateTimers(event : ProgramEvent) : void {

        const JUMP_SPEED : number = -2.25;
        const MAGIC_RECOVER_SPEED : number = 1.0/210.0;

        if (this.knockbackTimer > 0) {

            this.knockbackTimer -= event.tick;
            if (this.knockbackTimer <= 0 && this.health <= 0) {

                this.deathTimer = 0;
                this.dying = true;
                this.spr.setFrame(1, 3);

                event.audio.stopMusic();
                event.audio.playSample(event.assets.getSample("death"), 0.40);
            }
        }
        else if (this.hurtTimer > 0) {

            this.hurtTimer -= event.tick;
        }

        if (this.ledgeTimer > 0) {

            this.ledgeTimer -= event.tick;
        }

        if (this.jumpTimer > 0) {

            this.jumpTimer -= event.tick;
            this.speed.y = JUMP_SPEED;
            this.target.y = this.speed.y;
        }

        if (this.downAttackWait > 0) {

            this.downAttackWait -= event.tick;
        }

        if (this.magic < this.maxMagic) {

            this.magic = Math.min(this.maxMagic, this.magic + MAGIC_RECOVER_SPEED*event.tick);
        }
    }


    private computeStats() : void {

        this.maxHealth = 5 + this.progress.getProperty("life_containers");
        if (this.progress.getProperty("shopitem1")) {

            ++ this.maxHealth;
        }

        this.attackPower = 1;
        if (this.progress.getProperty("shopitem3")) {

            ++ this.attackPower;
        }
        if (this.progress.getProperty("item5")) {

            ++ this.attackPower;
        }

        this.attackSpeed = 1;
        if (this.progress.getProperty("shopitem6")) {

            this.attackSpeed = 2;
        }

        this.armor = 0;
        if (this.progress.getProperty("shopitem5")) {

            ++ this.armor;
        }

        this.magicPower = 2;
        if (this.progress.getProperty("shopitem4")) {

            ++ this.magicPower;
        }

        this.maxMagic = 3 + this.progress.getProperty("magic_containers");
        if (this.progress.getProperty("shopitem2")) {

            ++ this.maxMagic;
        }

        this.runSpeed = 1.0;
        if (this.progress.getProperty("item3")) {

            this.runSpeed += 0.5;
        }

        this.friction.x = 0.15*this.runSpeed;
    }


    private updateFlags() : void {

        this.touchLadder = false;
        this.touchLadderTop = false;
        this.showIcon = false;
        this.showObtainedItem = false;
    }


    private drawDeath(canvas : Canvas, bmp : Bitmap | undefined) : void {

        const ORB_COUNT : number = 8;
        const ORB_DISTANCE : number = 64;

        const t = this.deathTimer / DEATH_TIME;
        const step = Math.PI*2 / ORB_COUNT;

        let angle : number;

        const dx = Math.round(this.pos.x);
        const dy = Math.round(this.pos.y);

        for (let i = 0; i < ORB_COUNT; ++ i) {

            angle = step*i;

            this.spr.draw(canvas, bmp,
                dx + Math.round(Math.cos(angle)*t*ORB_DISTANCE) - 8,
                dy + Math.round(Math.sin(angle)*t*ORB_DISTANCE) - 8);
        }
    }


    protected verticalCollisionEvent(dir : -1 | 1, event : ProgramEvent) : void {
        
        const LEDGE_TIME : number = 8;
        const DOWN_ATTACK_WAIT : number = 15;

        if (dir == 1) {

            this.canDoubleJump = this.progress.getProperty("item6") == 1;
            
            this.ledgeTimer = LEDGE_TIME;
            this.climbing = false;

            this.doubleJumping = false;

            if (this.downAttacking) {

                this.downAttackWait = DOWN_ATTACK_WAIT;
                this.downAttacking = false;
            }
            return;
        }

        this.jumpTimer = 0;
    }


    protected die(event : ProgramEvent) : boolean {

        this.spr.animate(3, 1, 3, 4, event.tick);

        return ((this.deathTimer += event.tick)) >= DEATH_TIME;
    }


    protected updateEvent(event : ProgramEvent) : void {

        this.computeStats();
        this.control(event);
        this.animate(event);
        this.updateTimers(event);
        this.updateFlags();
    }   


    public ladderCollision(x : number, y : number, w : number, h : number, 
        ladderTop : boolean, event : ProgramEvent) : boolean {

        if (!this.exist || this.dying)
            return false;

        if (overlayRect(this.pos, this.collisionBox, new Vector(), new Rectangle(x + w/2, y + h/2, w, h))) {

            this.touchLadder ||= !ladderTop;
            this.touchLadderTop ||= ladderTop;

            if (this.touchLadderTop && this.touchSurface && !this.climbing) {

                this.showActionIcon(1);
            }
            else if (this.touchLadder && !this.climbing) {

                this.showActionIcon(0);
            }

            this.ladderX = x + w/2;

            return true;
        }
        return false;
    }


    public draw(canvas : Canvas) : void {

        const WEAPON_XOFF : number[] = [2, -18];

        if (!this.exist || 
            (this.specialAnimationTimer <= 0 && 
                !this.dying && 
                this.hurtTimer > 0 && 
                Math.floor(this.hurtTimer/4) % 2 == 0))
            return;

        const bmp = canvas.getBitmap("player");
        if (this.dying) {

            this.drawDeath(canvas, bmp);
            return;
        }

        const bmpWeapons = canvas.getBitmap("weapons");

        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y) - 7;

        const flip = (this.climbing && !this.attacking) ? Flip.None : this.flip;

        let sx : number;
        let sy : number;

        if (this.downAttacking || this.downAttackWait > 0) {

            sy = 32 + Number(this.hasStrongSword())*32;
            canvas.drawBitmap(bmp, flip, dx, dy, 96, sy, 16, 32);
            return;
        }

        this.spr.draw(canvas, bmp, dx, dy, flip);

        if (this.attacking && !this.usingMagic && this.sprWeapon.getColumn() < 5) {

            this.sprWeapon.draw(canvas, bmpWeapons, dx + WEAPON_XOFF[flip], dy - 8, flip);
        }

        let bmpItems : Bitmap | undefined;
        if (this.showObtainedItem && this.specialAnimationParam >= 1) {

            bmpItems = canvas.getBitmap("items");

            sx = (this.specialAnimationParam - 1) % 16;
            sy = ((this.specialAnimationParam - 1)/16) | 0;

            canvas.drawBitmap(bmpItems, Flip.None, 
                dx, dy - 16, 
                sx*16, sy*16, 16, 16);
        }
    }


    public drawIcon(canvas : Canvas) : void {

        const Y_OFFSET : number = -18;

        if (!this.isActive() || !this.showIcon || this.knockbackTimer > 0)
            return;

        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y) - 7 + Y_OFFSET;

        const bmp = canvas.getBitmap("player");

        this.sprIcon.draw(canvas, bmp, dx, dy);
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

        if (this.knockbackTimer > 0) {

            this.horizontalCollision(left, top, camera.height, -1, event);
            this.horizontalCollision(right, top, camera.height, 1, event);
        }

        if (this.knockbackTimer <= 0 &&
            this.speed.x > 0 && this.pos.x + H_MARGIN >= right) {

            dx = 1;
        }
        else if (this.knockbackTimer <= 0 &&
            this.speed.x < 0 && this.pos.x - H_MARGIN <= left) {

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


    public hurt(dirx : number, damage : number, event : ProgramEvent) : void {

        const KNOCKBACK_TIME : number = 30;
        const HURT_TIME : number = 60;
        const KNOCKBACK_SPEED : number = 3.0;

        if (this.hurtTimer > 0)
            return;

        damage = Math.max(1, damage - this.armor);

        this.knockbackTimer = KNOCKBACK_TIME;
        this.hurtTimer = HURT_TIME;

        this.speed.x = Math.sign(dirx)*KNOCKBACK_SPEED;

        this.climbing = false;
        this.jumpTimer = 0;
        this.attacking = false;
        this.downAttacking = false;
        this.downAttackWait = 0;

        this.health = Math.max(0, this.health - damage);

        this.flyingMessages.spawn(this.pos.x, this.pos.y - 6, -damage, FlyingMessageSymbol.None, new RGBA(255, 0, 0));

        event.audio.playSample(event.assets.getSample("hurt"), 0.60);
    }


    public hurtCollision(x : number, y : number, w : number, h : number, damage : number, event : ProgramEvent) : boolean {

        if (!this.isActive() || this.hurtTimer > 0)
            return false;

        if (overlayRect(this.pos, this.collisionBox, new Vector(), new Rectangle(x + w/2, y + h/2, w, h)) ) {

            this.hurt(-this.dir, damage, event);
            return true;
        }
        return false;
    }


    public projectileCollision(o : Projectile, event : ProgramEvent) : boolean {


        if (!o.isActive() || !this.isActive() || o.isFriendly() || this.hurtTimer > 0)
            return false;
            
        if (o.overlay(this)) {

            o.kill(event);
            this.hurt(this.pos.x > o.getPosition().x ? 1: -1, o.getDamage(), event);

            return true;
        }
        return false;
    }


    public doesOverlaySword(o : GameObject, targetSwordId : number) : boolean {

        const DOWN_ATTACK_SPEED_EPS : number = -0.25;

        const downAttack = (this.downAttacking && this.speed.y >= DOWN_ATTACK_SPEED_EPS) || 
            this.downAttackWait > 0;
        const baseAttack = !this.usingMagic &&
            this.attacking && 
            targetSwordId != this.swordHitId &&
            this.sprWeapon.getColumn() <= 2;

        if (!downAttack && !baseAttack)
            return false;

        return o.overlayRect(new Vector(), this.swordHitArea);
    }


    public downAttackBounce() : boolean {

        // TODO: Use jumpTimer instead?

        const BOUNCE_SPEED : number = -2.75;

        if (!this.downAttacking && this.downAttackWait <= 0)
            return false;

        this.speed.y = BOUNCE_SPEED;
        this.downAttacking = false;
        this.downAttackWait = 0;

        return true;
    }


    public addCoins(count : number) : void {

        this.progress.updateProperty("coins", count);

        this.flyingMessages.spawn(
            this.pos.x, this.pos.y - 8, 
            count, FlyingMessageSymbol.Coin,
            new RGBA(255, 219, 0));
    }


    public recoverHealth(amount : number) : void {

        if (this.progress.getProperty("shopitem7")) {

            ++ amount;
        }

        this.health = Math.min(this.maxHealth, this.health + amount);

        this.flyingMessages.spawn(
            this.pos.x, this.pos.y - 8, 
            amount, FlyingMessageSymbol.Heart,
            new RGBA(182, 255, 0));
    }


    public recoverMagic(amount : number) : void {

        if (this.progress.getProperty("shopitem7")) {

            amount *= 2.0;
        }

        this.magic = Math.min(this.maxMagic, this.magic + amount);

        this.flyingMessages.spawn(
            this.pos.x, this.pos.y - 8, 
            amount, FlyingMessageSymbol.Magic,
            new RGBA(182, 255, 0));
    }


    public getDamage() : number {

        return (this.downAttacking ? 4 : 2) + this.attackPower;
    }


    public getHealth = () : number => this.health;
    public getMaxHealth = () : number => this.maxHealth;


    public getSwordHitID = () : number => this.swordHitId;


    public respawn(posx? : number, posy? : number) : void {

        this.jumpTimer = 0;
        this.ledgeTimer = 0;

        this.touchLadder = false;
        this.climbing = false;
        this.touchLadderTop = false;
        this.ladderX = 0;

        this.attacking = false;
        this.downAttacking = false;
        this.downAttackWait = 0;

        this.flip = Flip.None;
        this.dir = 1;

        this.swordHitId = 0;

        this.hurtTimer = 0;
        this.knockbackTimer = 0;

        this.showIcon = false;

        this.pos.x = posx ?? this.progress.getProperty("checkpointx", 0);
        this.pos.y = posy ?? this.progress.getProperty("checkpointy", 0);

        this.health = this.maxHealth;

        this.dying = false;
        this.exist = true;

        this.spr.setFrame(4, 3);

        this.activeSavepoint = undefined;
    }
    

    public kill(event : ProgramEvent) : void {

        if (this.dying)
            return;

        this.deathTimer = 0;
        this.dying = true;
        this.spr.setFrame(1, 3);

        event.audio.stopMusic();
        event.audio.playSample(event.assets.getSample("death"), 0.40);
    }


    public showActionIcon(id : number) : void {

        if (id == -1) {

            this.showIcon = false;
            return;
        }

        this.showIcon = true;
        this.iconID = id;

        const column = this.sprIcon.getColumn();
        if (this.sprIcon.getRow() != 4 ||
            column > id*2 + 1 ||
            column < id*2) {

            this.sprIcon.setFrame(id*2, 4);
        }
    }


    public updateSpecialAnimation(event : ProgramEvent) : void {

        const ANIM_SPEED : number[] = [0, 1.0/90.0, 1.0/45.0];

        if (this.specialAnimationTimer <= 0 || this.specialAnimationType == SpecialPlayerAnimationType.Frozen)
            return;

        this.specialAnimationTimer -= ANIM_SPEED[this.specialAnimationType]*event.tick;
        if (this.specialAnimationTimer <= 0) {

            this.specialAnimationCallback?.(event);
            return;
        }

        switch (this.specialAnimationType) {

        case SpecialPlayerAnimationType.HoldItem:

            this.spr.setFrame(5, 3);
            break;

        case SpecialPlayerAnimationType.Use:

            this.spr.setFrame(4, 2);
            break;    

        default:
            break;
        }
    }


    public toggleSpecialAnimation(type : SpecialPlayerAnimationType, 
        param : number, cb : (event : ProgramEvent) => void) : void {

        this.specialAnimationType = type;
        this.specialAnimationParam = param;
        this.specialAnimationTimer = 1.0;

        this.showIcon = false;
        this.showObtainedItem = type == SpecialPlayerAnimationType.HoldItem;

        this.specialAnimationCallback = cb;

        if (type != SpecialPlayerAnimationType.Frozen) {
            
            this.attacking = false;
            this.downAttacking = false;
            this.climbing = false;
        }
    } 


    public isSpecialAnimationActive = () : boolean => this.specialAnimationTimer > 0.0;


    public setCheckpoint(x : number, y : number) : void {
        
        this.progress.setProperty("checkpointx", x);
        this.progress.setProperty("checkpointy", y);
    }


    public setActiveSavePoint(o : GameObject | undefined) : void {

        this.activeSavepoint = o;
    }


    public isActiveSavepoint = (o : GameObject) : boolean => o === this.activeSavepoint;


    public setFrame(column : number, row : number) : void {

        this.spr.setFrame(column, row);
    }


    public setPosition(x : number, y : number, setCheckpoint : boolean = false) : void {

        this.pos.x = x;
        this.pos.y = y;

        if (setCheckpoint) {

            this.setCheckpoint(x, y);
        }
    }

    
    public hasStrongSword = () : boolean => this.progress.getProperty("item5") == 1;


    public isClimbing() : boolean {
        
        return this.climbing;
    }


    public getMagicAmount() : number | undefined {

        if (this.progress.getProperty("item2") != 1) {

            return undefined;
        }

        return this.magic;
    }


    public getMaxMagic = () : number => this.maxMagic;


    public getHealthWeight = () : number => 1.0 - this.health/this.maxHealth;
    public getMagicWeight = () : number => 1.0 - this.magic/this.maxMagic;


    public updateSpeedYAxis(delta : number, upperLimit : number, event : ProgramEvent) : void {

        this.speed.y = Math.max(upperLimit, this.speed.y + delta*event.tick);
    }


    public isAttacking = () : boolean => this.attacking && !this.downAttacking;


    public setHealth(amount : number) : void {

        this.health = amount;
    }


    public setKnockBack(time : number) : void {

        this.knockbackTimer = time;
    }


    public refreshCheckpoint() : void {

        this.progress.setProperty("checkpointx", this.pos.x);
        this.progress.setProperty("checkpointy", this.pos.y);
    }
}
