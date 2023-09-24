import { ProgramEvent } from "../core/event.js";
import { Canvas } from "../gfx/interface.js";
import { Camera } from "./camera.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";
import { Crate } from "./crate.js";
import { ParticleGenerator } from "./particlegenerator.js";
import { CollectibleGenerator } from "./collectiblegenerator.js";
import { ProgressManager } from "./progress.js";
import { FlyingMessageGenerator } from "./flyingmessagegenerator.js";
import { Enemy } from "./enemies/enemy.js";
import { getEnemyType } from "./enemies/enemytype.js";


export class GameObjectManager {
    
    
    private player : Player | undefined = undefined;
    private crates : Crate[];
    private enemies : Enemy[];

    private particles : ParticleGenerator;
    private collectibles : CollectibleGenerator;
    private flyingMessages : FlyingMessageGenerator;


    private readonly progress : ProgressManager;


    constructor(progress : ProgressManager, event : ProgramEvent) {

        this.crates = new Array<Crate> ();
        this.enemies = new Array<Enemy> ();

        this.particles = new ParticleGenerator();
        this.collectibles = new CollectibleGenerator();
        this.flyingMessages = new FlyingMessageGenerator();

        this.progress = progress;
    }


    private movingCameraCheck(camera : Camera, stage : Stage, event : ProgramEvent) : void {

        stage.cameraCheck(camera, this);
        this.player?.cameraCollision(camera, event);

        for (let c of this.crates) {

            c.cameraCheck(camera, event);
        }
    }


    private updateCrates(camera : Camera, stage : Stage, event : ProgramEvent) : void {

        let c1 : Crate;
        let c2 : Crate;

        for (let i = 0; i < this.crates.length; ++ i) {

            c1 = this.crates[i];

            c1.cameraCheck(camera, event);
            if (!c1.isInCamera()) {

                stage.remarkCreatableObject(c1.stageTileIndex);
                this.crates.splice(i, 1);
                continue;
            }

            if (!c1.isActive())
                continue;

            c1.update(event);

            stage.objectCollision(c1, event);

            for (let j = i; j < this.crates.length; ++ j) {

                c2 = this.crates[j];
                c2.collisionObjectCollision(c1, event);
            }

            if (this.player !== undefined) {

                c1.collisionObjectCollision(this.player, event);
                c1.playerCollision(this.player, event);

                if (!c1.doesExist()) {

                    this.crates.splice(i, 1);
                    continue;
                }
            }
        }
    }


    private updateEnemies(camera : Camera, stage : Stage, event : ProgramEvent) : void {

        let e1 : Enemy;
        let e2 : Enemy;

        for (let i = 0; i < this.enemies.length; ++ i) {

            e1 = this.enemies[i];
            if (!e1.doesExist())
                continue;

            e1.cameraCheck(camera, event);

            /*
            if (!e1.isInCamera()) {

                stage.remarkCreatableObject(e1.stageTileIndex);
                this.enemies.splice(i, 1);
                continue;
            }
            */

            if (!e1.isInCamera())
                continue;

            e1.update(event);
            e1.cameraCollision(camera, event);
            stage.objectCollision(e1, event);

            for (let j = i; j < this.enemies.length; ++ j) {

                e2 = this.enemies[j];
                e2.enemyToEnemyCollision(e1, event);
            }

            if (this.player !== undefined) {

                e1.playerCollision(this.player, event);
                if (!e1.doesExist()) {

                    this.enemies.splice(i, 1);
                    continue;
                }
            }

            for (let c of this.crates) {

                c.collisionObjectCollision(e1, event);
            }
        }
    }


    public update(camera : Camera | undefined, stage : Stage | undefined, event : ProgramEvent) : void {

        if (camera === undefined || stage === undefined)
            return;

        this.flyingMessages.update(event);

        if (camera?.isMoving()) {

            this.movingCameraCheck(camera, stage, event);
            return;
        }

        this.player?.update(event);
        this.player?.updateCollisionFlags();
        this.player?.cameraCollision(camera, event);
        stage?.objectCollision(this.player, event);

        this.updateCrates(camera, stage, event);
        this.updateEnemies(camera, stage, event);

        this.particles.update(stage, camera, event);
        this.particles.crateCollision(this.crates, event);

        this.collectibles.update(stage, camera, this.player, event);
        this.collectibles.crateCollision(this.crates, event);
    }


    public draw(canvas : Canvas) : void {

        const bmpCrate = canvas.getBitmap("crate");
        const bmpEnemies = canvas.getBitmap("enemies_small");

        for (let c of this.crates) {

            c.draw(canvas, bmpCrate);
        }
        this.particles.draw(canvas);

        for (let e of this.enemies) {

            e.draw(canvas, bmpEnemies);
        }

        this.collectibles.draw(canvas);

        this.player?.draw(canvas);

        this.flyingMessages.draw(canvas);
    }


    public addPlayer(x : number, y : number) : void {

        this.player = new Player(
            (x + 0.5)*TILE_WIDTH, (y + 0.5)*TILE_HEIGHT, 
            this.progress, this.flyingMessages);
    }


    public addCrate(x : number, y : number, stageIndex : number) : void {

        this.crates.push(
            new Crate(
                (x + 0.5)*TILE_WIDTH, (y + 0.5)*TILE_HEIGHT, stageIndex,
                this.particles, this.collectibles));
    }


    public addEnemy(x : number, y : number, stageIndex : number, enemyTypeIndex : number) : void {

        const type = getEnemyType(enemyTypeIndex);

        this.enemies.push(
            new type.prototype.constructor(
                (x + 0.5)*TILE_WIDTH, (y + 0.5)*TILE_HEIGHT, stageIndex,
                this.flyingMessages, this.collectibles));
    }


    public getPlayerHealth = () : number => this.player.getHealth();
    public getPlayerMaxHealth = () : number => this.player.getMaxHealth();
}
