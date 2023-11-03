import { ProgramEvent } from "../../core/event.js";
import { TransitionType } from "../../core/transition.js";
import { Bitmap, Canvas, Flip } from "../../gfx/interface.js";
import { Sprite } from "../../gfx/sprite.js";
import { Rectangle } from "../../math/rectangle.js";
import { RGBA } from "../../math/rgba.js";
import { Vector } from "../../math/vector.js";
import { Camera } from "../camera.js";
import { CollectibleGenerator } from "../collectiblegenerator.js";
import { FlyingMessageGenerator } from "../flyingmessagegenerator.js";
import { Player } from "../player.js";
import { Projectile } from "../projectile.js";
import { ProjectileGenerator } from "../projectilegenerator.js";
import { Enemy } from "./enemy.js";
import { Hand } from "./hand.js";


const HAND_DISTANCE : number = 48;
const DROOL_TIME : number = 120;


const enum AttackType {

    BlueBall = 0,
    FireBalls = 1
};


export class FinalBoss extends Enemy {


    private waveTimer : number = 0.0;

    private droolTimer : number = 0.0;
    private sprDrool : Sprite;

    private hands : Array<Hand>;

    // TODO: Too many different timers?
    private shootWait : number = 0;
    private preparing : boolean = false;
    private shootPrepareTimer : number = 0;
    private mouthTimer : number = 0;
    private attackType : AttackType = AttackType.BlueBall;

    private shootDir : Vector;

    private healthRatio : number = 1.0;

    private deathEventTriggered : boolean = false;
    private waitForShakeTimer : number = 0;

    private endingCallback : ((event : ProgramEvent) => void) | undefined = undefined;


    constructor(x : number, y : number, 
        stageTileIndex : number,
        messages : FlyingMessageGenerator,
        collectibles : CollectibleGenerator,
        projectiles : ProjectileGenerator,
        shakeCallback? : (amount : number, time : number) => void,
        endingCallback? : (event : ProgramEvent) => void) {

        super(x, y, stageTileIndex, messages, collectibles, projectiles, shakeCallback);

        this.friction.x = 0.25;
        this.friction.y = 0.025;

        this.damage = 2;

        this.maxHealth = 100;
        this.health = this.maxHealth;

        this.dropProbability = 0.0;

        this.collisionBox = new Rectangle(0, 0, 32, 32);
        this.hitbox = new Rectangle(0, 0, 48, 48);

        this.getGravity = false;

        this.weight = 0.50;

        this.dir = 1;

        this.hands = new Array<Hand> (2);
        for (let i = 0; i < 2; ++ i) {

            this.hands[i] = new Hand(
                x + HAND_DISTANCE*(-1 + i*2), 
                y, 
                stageTileIndex, messages, collectibles, projectiles, shakeCallback);
            this.hands[i].initialize(
                this.pos, HAND_DISTANCE, 
                i == 0 ? Flip.None : Flip.Horizontal,
                i == 0 ? -1 : 1);
        }

        this.harmful = false;

        this.sprDrool = new Sprite(16, 16);

        this.shootDir = new Vector();

        this.endingCallback = endingCallback;
    }


    private shootBlueBall(player : Player) : void {

        const SHOOT_SPEED : number = 1.0;

        const p = this.projectiles.spawn(this.pos.x, this.pos.y + 16,
            this.shootDir.x*SHOOT_SPEED, this.shootDir.y*SHOOT_SPEED, 
            5, 3, false, false, true);
        p.setTargetObject(player);
    }


    private shootFireballs() : void {

        const COUNT : number = 8;
        const SPEED : number = 2.0;

        const angleStep = Math.PI*2/COUNT;

        let angle : number;
        for (let i = 0; i < COUNT; ++ i) {

            angle = angleStep*i;

            this.projectiles.spawn(this.pos.x, this.pos.y + 16,
                Math.cos(angle)*SPEED, Math.sin(angle)*SPEED, 
                6, 2, false, false, true);
        }
    }


    private canAttack() : boolean {

        for (let h of this.hands) {

            if (!h.isFree()) {

                return false;
            }
        }
        return true;
    }


    private updateShooting(player : Player, event : ProgramEvent) : void {

        const SHOOT_WAIT_MODIFIER : number = 1.0;
        const SHOOT_TIME : number = 300;
        const PREPARE_TIME : number = 60;
        const MOUTH_TIME : number = 30;

        if (this.preparing) {

            for (let h of this.hands) {

                h.toggleCanAttack(false);
            }

            this.shootPrepareTimer += event.tick;
            if (this.shootPrepareTimer >= PREPARE_TIME) {

                this.shootPrepareTimer = 0;
                this.preparing = false;

                event.audio.playSample(event.assets.getSample("throw"), 0.60);
                
                if (this.attackType == AttackType.BlueBall) {

                    this.shootBlueBall(player);
                }
                else {

                    this.shootFireballs();
                }

                this.mouthTimer = MOUTH_TIME;
                this.attackType = Number(!Boolean(this.attackType));

                for (let h of this.hands) {

                    h.toggleCanAttack(true);
                }
            }
        }   
        else if (this.canAttack()) {

            this.shootWait += (1.0 + (1.0 - this.healthRatio)*SHOOT_WAIT_MODIFIER)*event.tick;
            if (this.shootWait >= SHOOT_TIME) {

                event.audio.playSample(event.assets.getSample("prepare"), 0.80);
                this.preparing = true;
                this.shootWait = 0;
                this.shootPrepareTimer = 0;
            }
        }
    }


    protected playerEvent(player : Player, event : ProgramEvent): void {
        
        for (let h of this.hands) {

            h.playerCollision(player, event);
        }

        if (this.preparing) {

            this.shootDir = Vector.direction(this.pos, player.getPosition());
        }

        if (this.droolTimer < DROOL_TIME) {

            this.updateShooting(player, event);
        }
    }


    protected die(event : ProgramEvent) : boolean {

        const SHAKE_WAIT : number = 60;

        if (!this.deathEventTriggered) {

            event.audio.stopMusic();
            event.audio.playSample(event.assets.getSample("finalboss_dead"), 0.50);

            this.deathEventTriggered = true;
        }

        if (this.waitForShakeTimer < SHAKE_WAIT) {

            this.waitForShakeTimer += event.tick;
            if (this.waitForShakeTimer >= SHAKE_WAIT) {

                event.audio.playSample(event.assets.getSample("teleport"), 0.35);

                this.shakeCallback(16, 180);

                event.transition.activate(true, TransitionType.Fade, 1.0/120.0, event, 
                    this.endingCallback, new RGBA(255, 255, 255));
            }
        }

        // Final bosses never die!
        return false;
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const MOVE_TARGET : number = 0.25;
        const MOVE_TARGET_EXTRA : number = 0.15;
        const WAVE_AMPLITUDE_BASE : number = 0.5;
        const WAVE_AMPLITUDE_EXTRA: number = 0.25;
        const WAVE_SPEED_BASE : number = Math.PI*2/270.0;
        const WAVE_SPEED_MODIFIER : number = 0.5;

        this.healthRatio = this.health/this.maxHealth;

        this.target.x = this.dir*(MOVE_TARGET + (1.0 - this.healthRatio)*MOVE_TARGET_EXTRA);

        if ( (this.dir > 0 && this.pos.x > event.screenWidth - 32) ||
             (this.dir < 0 && this.pos.x < 32) ) {

            this.dir *= -1;
            this.speed.x *= -1;
            this.target.x *= -1;
        }

        const waveSpeed = WAVE_SPEED_BASE*(1.0 + (1.0 - this.healthRatio)*WAVE_SPEED_MODIFIER);
        this.waveTimer = (this.waveTimer + waveSpeed*event.tick) % (Math.PI*2);

        const waveAmplitude = WAVE_AMPLITUDE_BASE + (1.0 - this.healthRatio)*WAVE_AMPLITUDE_EXTRA;
        this.target.y = Math.sin(this.waveTimer)*waveAmplitude;

        for (let h of this.hands) {

            h.update(event);
            h.setSpeedModifier(1.0 - this.healthRatio);
            if (this.health <= this.maxHealth/2) {

                h.activateSecondPhase();
            }
        }

        if (this.mouthTimer > 0) {

            this.mouthTimer -= event.tick;
            return;
        }

        if (this.preparing)
            return;

        this.droolTimer += (2.0 - this.healthRatio)*event.tick;
        if (this.droolTimer >= DROOL_TIME) {

            this.sprDrool.animate(4, 0, 3, 10, event.tick);
            if (this.sprDrool.getColumn() == 3) {

                event.audio.playSample(event.assets.getSample("drop"), 0.70);

                this.droolTimer = 0;
                this.projectiles.spawn(
                    this.pos.x, this.pos.y + 24, 
                    0, this.speed.y, 
                    4, 2, false, true);

                this.sprDrool.setFrame(0, 4);
            }
        }
    }


    public draw(canvas : Canvas, _?: Bitmap): void {
        
        if (!this.exist)
            return;

        const bmp = canvas.getBitmap("final_boss");
        const bmpProjectile = canvas.getBitmap("projectiles");

        const dx = Math.round(this.pos.x) - 32;
        const dy = Math.round(this.pos.y) - 32;

        let frame : number = 0;

        if (this.dying || 
            this.hurtTimer <= 0 || 
            Math.floor(this.hurtTimer/4) % 2 != 0) {

            if (!this.dying &&
                this.preparing && 
                Math.floor(this.shootPrepareTimer/4) % 2 == 0) {

                if (this.attackType == AttackType.BlueBall) {

                    canvas.setColor(73, 146, 255);
                }
                else {
                    
                    canvas.setColor(255, 146, 73);
                }
            }

            if (this.dying) {

                frame = 3;
            }
            else if (this.preparing) {

                frame = 1;
            }
            else if (this.mouthTimer > 0) {

                frame = 2;
            }

            // Body
            canvas.drawBitmap(bmp, Flip.None, dx, dy, 0, frame*64, 64, 64);

            if (!this.dying && this.droolTimer >= DROOL_TIME) {

                this.sprDrool.draw(canvas, bmpProjectile, dx + 24, dy + 48);
            }

            canvas.setColor();
        }

        // Hands 
        for (let h of this.hands) {

            h.draw(canvas);
        }
        
    }


    public setInitialHandPositions(camera : Camera) : void {

        for (let h of this.hands) {

            h.shift(0, -camera.height*2)
        }
    }


    public getRelativeHealth = () : number => this.health/this.maxHealth;
}
