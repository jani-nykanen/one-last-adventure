import { ProgramEvent } from "../../core/event.js";
import { Bitmap, Canvas, Flip } from "../../gfx/interface.js";
import { Rectangle } from "../../math/rectangle.js";
import { Vector } from "../../math/vector.js";
import { Camera } from "../camera.js";
import { CollectibleGenerator } from "../collectiblegenerator.js";
import { FlyingMessageGenerator } from "../flyingmessagegenerator.js";
import { Player } from "../player.js";
import { ProjectileGenerator } from "../projectilegenerator.js";
import { Enemy } from "./enemy.js";
import { Hand } from "./hand.js";


const HAND_DISTANCE : number = 52;


export class FinalBoss extends Enemy {


    private waveTimer : number = 0.0;

    private hands : Array<Hand>;


    constructor(x : number, y : number, 
        stageTileIndex : number,
        messages : FlyingMessageGenerator,
        collectibles : CollectibleGenerator,
        projectiles : ProjectileGenerator,
        shakeCallback : ((amount : number, time : number) => void) | undefined = undefined) {

        super(x, y, stageTileIndex, messages, collectibles, projectiles, shakeCallback);

        this.friction.x = 0.25;
        this.friction.y = 0.025;

        this.damage = 2;

        this.maxHealth = 128;
        this.health = this.maxHealth;

        this.dropProbability = 0.0;

        this.collisionBox = new Rectangle(0, 0, 32, 32);
        this.hitbox = new Rectangle(0, 0, 40, 32);

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
    }


    protected playerEvent(player : Player, event : ProgramEvent): void {
        
        for (let h of this.hands) {

            h.playerCollision(player, event);
        }
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const MOVE_TARGET : number = 0.25;
        const WAVE_AMPLITUDE : number = 0.5;
        const WAVE_SPEED : number = Math.PI*2/240.0;

        this.target.x = this.dir*MOVE_TARGET;

        if ( (this.dir > 0 && this.pos.x > event.screenWidth - 32) ||
             (this.dir < 0 && this.pos.x < 32) ) {

            this.dir *= -1;
            this.speed.x *= -1;
            this.target.x *= -1;
        }

        this.waveTimer = (this.waveTimer + WAVE_SPEED*event.tick) % (Math.PI*2);

        this.target.y = Math.sin(this.waveTimer)*WAVE_AMPLITUDE;

        for (let h of this.hands) {

            h.update(event);
        }
    }


    public draw(canvas : Canvas, _?: Bitmap): void {
        
        if (!this.exist)
            return;

        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer/4) % 2 == 0)
            return;

        const bmp = canvas.getBitmap("final_boss");

        const dx = Math.round(this.pos.x) - 32;
        const dy = Math.round(this.pos.y) - 32;

        // Body
        canvas.drawBitmap(bmp, Flip.None, dx, dy, 0, 0, 64, 64);

        // Hands (temporarily here?)
        for (let h of this.hands) {

            h.draw(canvas);
        }
    }


    public setInitialHandPositions(camera : Camera) : void {

        for (let h of this.hands) {

            h.shift(0, -camera.height)
        }
    }
}
