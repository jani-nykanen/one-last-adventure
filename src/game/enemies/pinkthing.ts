import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Player } from "../player.js";
import { TILE_WIDTH } from "../tilesize.js";
import { Enemy } from "./enemy.js";



export class PinkThing extends Enemy {


    // protected playerDiff : number = 0;


    protected init() : void {
        
        this.damage = 2;

        this.maxHealth = 6;

        this.spr.setFrame(0, 8);

        this.collisionBox.w = 8;

        this.friction.x = 0.025;
        this.weight = 0.50;
    }


    protected playerEvent(player: Player, event: ProgramEvent): void {
        
        this.dir = player.getPosition().x - this.pos.x > 0 ? 1 : -1;
        if (this.touchSurface) {

            this.flip = this.dir > 0 ? Flip.Horizontal : Flip.None;
        }

        // this.playerDiff = this.pos.y - player.getPosition().y;
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const MOVE_SPEED : number = 1.0;
        const LEDGE_JUMP_HEIGHT : number = -1.5;
        const NORMAL_JUMP_HEIGHT : number = -2.5;
        // const JUMP_TRIGGER_DISTANCE : number = 64;
        const JUMP_ANIM_EPS : number = 0.5;

        let frame : number;
        if (this.touchSurface) {

            this.spr.animate(this.spr.getRow(), 0, 3, 5, event.tick);
            this.flip = this.dir > 0 ? Flip.Horizontal : Flip.None;

            this.target.x = this.dir*MOVE_SPEED*event.tick;
        }
        else {

            frame = 0;
            if (this.speed.y < -JUMP_ANIM_EPS)
                frame = 4;
            else if (this.speed.y > JUMP_ANIM_EPS)
                frame = 5;

            this.spr.setFrame(frame, this.spr.getRow());
        }

        const jumpCond1 = (this.didTouchSurface && !this.touchSurface) ;
        // const jumpCond2 = this.playerDiff > JUMP_TRIGGER_DISTANCE;

        if (this.hurtTimer <= 0 && jumpCond1) { // (jumpCond1 || jumpCond2)) {

            this.speed.y = jumpCond1 ? LEDGE_JUMP_HEIGHT : NORMAL_JUMP_HEIGHT;
            event.audio.playSample(event.assets.getSample("enemy_jump"), 0.40);
        }
    }


    protected horizontalCollisionEvent(dir: 1 | -1, event : ProgramEvent): void {
        
        this.dir *= -1;
    }
}
