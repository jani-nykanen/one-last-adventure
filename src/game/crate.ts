import { ProgramEvent } from "../core/event.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Rectangle } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { CollisionObject } from "./collisionobject.js";
import { ParticleGenerator } from "./particlegenerator.js";
import { Player } from "./player.js";
import { CollectibleGenerator } from "./collectiblegenerator.js";


export class Crate extends CollisionObject {


    private id : number;

    private readonly particles : ParticleGenerator;
    private readonly collectibles : CollectibleGenerator;

    private purpleToggleCallback : ((event : ProgramEvent) => void) | undefined = undefined;

    public readonly stageTileIndex : number = 0;


    constructor(x : number, y : number, stageTileIndex : number,
        particles : ParticleGenerator, collectibles : CollectibleGenerator,
        id : number = 0, 
        purpleToggleCallback? : (event : ProgramEvent) => void) {

        super(x, y, true);

        this.hitbox = new Rectangle(0, 0, 16, 16);
        this.collisionBox = this.hitbox.clone();

        this.friction = new Vector(0, 0.25);
    
        this.stageTileIndex = stageTileIndex;

        this.particles = particles;
        this.collectibles = collectibles;

        this.purpleToggleCallback = purpleToggleCallback;

        this.inCamera = true;

        this.id = id;
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
                (Math.random()*4) | 0,
                this.id);
        }
    }
 

    private breakSelf(o : CollisionObject, player : Player, event : ProgramEvent) : void {

        const dir = Vector.direction(o.getPosition(), this.pos);

        this.spawnParticles();

        if (this.id == 0) {
            
            this.collectibles.spawnWeighted(this.pos, dir, 
                1.0 - player.getHealth()/player.getMaxHealth());
        }

        this.exist = false;

        event.audio.playSample(event.assets.getSample("break"), 0.60);
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

        canvas.drawBitmap(bmp, Flip.None, dx, dy, this.id*16, 0, 16, 16);
    }


    public collisionObjectCollision(o : CollisionObject, player : Player, event : ProgramEvent, forceBreak : boolean = false) : void {

        if (!this.isActive() || !o.isActive())
            return;

        // TODO: Maybe check if the collidable object is close enough before
        // making four function calls (that will check the same thing, anyway,
        // though)?

        let collided = false;

        collided = o.verticalCollision(this.pos.x - 7, this.pos.y - 8, 14, 1, event) || collided;
        collided = o.verticalCollision(this.pos.x - 7, this.pos.y + 8, 14, -1, event) || collided;
        collided = o.horizontalCollision(this.pos.x - 8, this.pos.y - 8, 16, 1, event) || collided;
        collided = o.horizontalCollision(this.pos.x + 8, this.pos.y - 8, 16, -1, event) || collided;
        
        if (collided && forceBreak && this.id != 1) {

            // TODO: If crates are broken with projectiles, the crates never spawn
            // hearts...
            this.breakSelf(o, player, event);

            if (this.id == 2) {

                this.purpleToggleCallback?.(event);
            }
        }
    }


    public playerCollision(player : Player, event : ProgramEvent) : void {

        if (!this.isActive() || !player.isActive() || this.id == 2)
            return;

        if ((this.id != 1 || player.hasStrongSword()) &&
            player.doesOverlaySword(this, -1)) {
            
            this.breakSelf(player, player, event);
            player.downAttackBounce();
        }
    }

}
