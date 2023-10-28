import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Player } from "../player.js";
import { Enemy } from "./enemy.js";



export class Bull extends Enemy {



    protected init() : void {
        
        this.damage = 3;

        this.maxHealth = 10;

        this.spr.setFrame(0, 13);

        this.collisionBox.w = 8;

        this.friction.x = 0.10;
        this.friction.y = 0.15;
        this.weight = 1.0;

        this.dropProbability = 0.85;
    }


    protected playerEvent(player: Player, event: ProgramEvent): void {
        
        const AVOID_JUMP_HEIGHT : number = -2.75;
        const JUMP_HEIGHT : number = -3.25;
        const MIN_DISTANCE : number = 64;

        this.dir = Math.sign(player.getPosition().x - this.pos.x);
        if (this.touchSurface) {

            this.flip = this.dir > 0 ? Flip.Horizontal : Flip.None;
        }

        // this.playerDiff = this.pos.y - player.getPosition().y;

        const cond1 = player.isAttacking();
        const cond2 = this.pos.y - player.getPosition().y > MIN_DISTANCE;

        if (this.hurtTimer <= 0 &&
            this.touchSurface && 
            (cond1 || cond2)) {
 
            this.speed.y = cond2 ? JUMP_HEIGHT : AVOID_JUMP_HEIGHT;
            event.audio.playSample(event.assets.getSample("enemy_jump"), 0.40);
        }
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const MOVE_SPEED : number = 0.5;
        const LEDGE_JUMP_HEIGHT : number = -3.0;
        const JUMP_ANIM_EPS : number = 0.5;

        let frame : number;

        if (this.touchSurface) {

            this.flip = this.dir > 0 ? Flip.Horizontal : Flip.None;
            this.target.x = this.dir*MOVE_SPEED*event.tick;

            this.spr.animate(this.spr.getRow(), 0, 3, 5, event.tick);
        }
        else {

            frame = 0;
            if (this.speed.y < -JUMP_ANIM_EPS)
                frame = 4;
            else if (this.speed.y > JUMP_ANIM_EPS)
                frame = 5;

            this.spr.setFrame(frame, this.spr.getRow());
        }


        if (this.hurtTimer <= 0 && 
            this.didTouchSurface && !this.touchSurface) { 

            this.speed.y = LEDGE_JUMP_HEIGHT;
            event.audio.playSample(event.assets.getSample("enemy_jump"), 0.40);
        }
    }
}
