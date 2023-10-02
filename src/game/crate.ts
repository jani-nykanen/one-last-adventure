import { ProgramEvent } from "../core/event.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Rectangle } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { CollisionObject } from "./collisionobject.js";
import { ParticleGenerator } from "./particlegenerator.js";
import { Player } from "./player.js";
import { CollectibleGenerator } from "./collectiblegenerator.js";


export class Crate extends CollisionObject {


    private readonly particles : ParticleGenerator;
    private readonly collectibles : CollectibleGenerator;

    public readonly stageTileIndex : number = 0;


    constructor(x : number, y : number, stageTileIndex : number,
        particles : ParticleGenerator, collectibles : CollectibleGenerator) {

        super(x, y, true);

        this.hitbox = new Rectangle(0, 0, 16, 16);
        this.collisionBox = this.hitbox.clone();

        this.friction = new Vector(0, 0.25);
    
        this.stageTileIndex = stageTileIndex;

        this.particles = particles;
        this.collectibles = collectibles;

        this.inCamera = true;
    }


    private spawnParticles() : void {

        const DX : number[] = [-4, 4, -4, 4];
        const DY : number[] = [-4, -4, 4, 4];
        const SPEED_X : number[] = [-1, 1, -1, 1];
        const SPEED_Y : number[] = [-1.5, -1.5, 0.5, 0.5];

        const NOISE : number = 0.5;

        let noisex : number;
        let noisey : number;

        for (let i = 0; i < 4; ++ i) {

            noisex = 2*(Math.random() - 0.5)*NOISE;
            noisey = -Math.random()*NOISE;

            this.particles.spawn(
                this.pos.x + DX[i] , 
                this.pos.y + DY[i], 
                SPEED_X[i] + noisex, 
                SPEED_Y[i] + noisey, 
                (Math.random()*4) | 0);
        }
    }
 

    protected updateEvent(event : ProgramEvent) : void {
        
        const GRAVITY = 4.0;

        this.target.y = GRAVITY;
    }


    public draw(canvas : Canvas, bmp : Bitmap) : void {
        
        if (!this.exist || !this.inCamera)
            return;
    
        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y) - 8;

        canvas.drawBitmap(bmp, Flip.None, dx, dy, 0, 0, 16, 16);
    }


    public collisionObjectCollision(o : CollisionObject, event : ProgramEvent) : void {

        if (!this.isActive() || !o.isActive())
            return;

        // TODO: Maybe check if the collidable object is close enough before
        // making four function calls (that will check the same thing, anyway,
        // though)?

        o.verticalCollision(this.pos.x - 7, this.pos.y - 8, 14, 1, event);
        o.verticalCollision(this.pos.x - 7, this.pos.y + 8, 14, -1, event);
        o.horizontalCollision(this.pos.x - 8, this.pos.y - 8, 16, 1, event);
        o.horizontalCollision(this.pos.x + 8, this.pos.y - 8, 16, -1, event);
    }


    public playerCollision(player : Player, event : ProgramEvent) : void {

        if (!this.isActive() || !player.isActive())
            return;

        const dir = Vector.direction(player.getPosition(), this.pos);

        if (player.doesOverlaySword(this, -1)) {
            
            this.spawnParticles();
            this.collectibles.spawnWeighted(
                this.pos, dir, 1.0 - player.getHealth()/player.getMaxHealth());

            player.downAttackBounce();
            this.exist = false;

            event.audio.playSample(event.assets.getSample("break"), 0.60);
        }
    }

}
