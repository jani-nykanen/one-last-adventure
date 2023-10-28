import { ProgramEvent } from "../../core/event.js";
import { Flip } from "../../gfx/interface.js";
import { Rectangle } from "../../math/rectangle.js";
import { Vector } from "../../math/vector.js";
import { Player } from "../player.js";
import { Projectile } from "../projectile.js";
import { Enemy } from "./enemy.js";



export class Ufo extends Enemy {


    private shootTimer : number = 0;
    private shootWait : number = 0;

    
    protected init() : void {
        
        this.damage = 3;

        this.maxHealth = 10;

        this.spr.setFrame(0, 16);

        this.collisionBox = new Rectangle(0, 0, 8, 8);
        this.hitbox = new Rectangle(0, 0, 10, 8);

        this.friction.x = 0.025;
        this.friction.y = 0.025;

        this.getGravity = false;

        this.weight = 0.5;

        this.checkVerticalCameraCollision = true;
        this.disableCollisions = true;

        this.specialTimer = Math.random()*Math.PI*2;

        this.dropProbability = 1.0;
    }


    protected playerEvent(player : Player, event : ProgramEvent) : void {
        
        const MOVE_TARGET : number = 1.25;
        const OFFSET_RADIUS : number = 48;
        const SHOOT_SPEED : number = 3.0;
        const SHOOT_TIME : number = 120;
        const SHOOT_WAIT : number = 30;

        if (this.shootWait > 0)
            return;

        const xoff = Math.cos(this.specialTimer)*OFFSET_RADIUS;
        const yoff = Math.sin(this.specialTimer)*OFFSET_RADIUS;

        const target = player.getPosition();

        let dir : Vector;
        let p : Projectile;

        // this.shootTimer += event.tick
        if (this.shootTimer >= SHOOT_TIME) {

            dir = Vector.direction(this.pos, target);

            event.audio.playSample(event.assets.getSample("throw"), 0.60);

            p = this.projectiles.spawn(this.pos.x, this.pos.y, dir.x*SHOOT_SPEED, dir.y*SHOOT_SPEED, 2, 2, false, false, false);
            p.setOldPos(this.pos.x, this.pos.y);

            this.shootWait = SHOOT_WAIT;
            this.target.zeros();
            this.speed.zeros();

            this.shootTimer = 0;

            return;
        }

        target.x += xoff;
        target.y += yoff;

        this.target = Vector.scalarMultiply(
            Vector.direction(this.pos, target), 
            MOVE_TARGET);
    }


    protected updateAI(event : ProgramEvent) : void {
        
        const CIRCULATION_SPEED : number = Math.PI*2 / 180;

        if (this.shootWait > 0) {

            this.shootWait -= event.tick;
            this.spr.animate(this.spr.getRow(), 4, 5, 4, event.tick);

            return;
        }

        this.shootTimer += event.tick;
        this.specialTimer = (this.specialTimer + CIRCULATION_SPEED*event.tick) % (Math.PI*2);

        this.spr.animate(this.spr.getRow(), 0, 3, 5, event.tick);

        this.flip = Flip.None;
    }
}
