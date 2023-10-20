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
        this.friction.y = 0.10;
        this.weight = 0.50;
    }


    protected playerEvent(player: Player, event: ProgramEvent): void {
        
        this.dir = Math.sign(player.getPosition().x - this.pos.x);
        if (this.touchSurface) {

            this.flip = this.dir > 0 ? Flip.Horizontal : Flip.None;
        }

        // this.playerDiff = this.pos.y - player.getPosition().y;
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const MOVE_SPEED : number = 0.75;
        const LEDGE_JUMP_HEIGHT : number = -1.75;

        if (this.touchSurface) {

            this.flip = this.dir > 0 ? Flip.Horizontal : Flip.None;
            this.target.x = this.dir*MOVE_SPEED*event.tick;
        }

        this.spr.animate(this.spr.getRow(), 0, 3, 5, event.tick);

        const jumpCond1 = (this.didTouchSurface && !this.touchSurface) ;
        // const jumpCond2 = this.playerDiff > JUMP_TRIGGER_DISTANCE;

        if (this.hurtTimer <= 0 && jumpCond1) { // (jumpCond1 || jumpCond2)) {

            this.speed.y = LEDGE_JUMP_HEIGHT;
            event.audio.playSample(event.assets.getSample("enemy_jump"), 0.40);
        }
    }


    protected horizontalCollisionEvent(dir: 1 | -1, event : ProgramEvent): void {
        
        this.dir *= -1;
    }
}
