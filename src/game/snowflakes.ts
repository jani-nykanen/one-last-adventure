import { ProgramEvent } from "../core/event.js";
import { negMod } from "../math/utility.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject.js";
import { Camera } from "./camera.js";
import { Canvas } from "../gfx/interface.js";
import { next } from "./existingobject.js";
import { RGBA } from "../math/rgba.js";


class Snowflake extends GameObject {


    private speedFactor : Vector;
    private speedAngle : number = 0.0;

    private size : number = 1;


    constructor() {

        super(0, 0, false);

        this.speedFactor = new Vector();
        this.friction = new Vector(0.1, 0.1);
    }


    public spawn(x : number, y : number, speedx : number, speedy : number, size : number) : void {

        this.pos = new Vector(x, y);

        this.speedFactor = new Vector(speedx, speedy);
        this.speedAngle = Math.random() * Math.PI * 2;

        this.size = size;

        this.exist = true;
    }


    protected updateEvent(event : ProgramEvent) : void {

        const ANGLE_SPEED = 0.05;
        const BOTTOM_MARGIN = 2;

        if (this.pos.y > event.screenHeight + BOTTOM_MARGIN) {

            this.exist = false;
        }

        this.speedAngle = (this.speedAngle + ANGLE_SPEED*event.tick) % (Math.PI*4);
        
        this.target.x = Math.sin(this.speedAngle*0.5) * this.speedFactor.x;
        this.target.y = this.speedFactor.y*0.5*((Math.sin(this.speedAngle) + 1.0));
    }


    public cameraEvent(camera : Camera) : void {

        const delta = camera.moveDelta();

        this.pos.x = negMod(this.pos.x - delta.x, camera.width);
        this.pos.y = negMod(this.pos.y - delta.y, camera.height);
    }


    public draw(canvas : Canvas) : void {

        if (!this.exist) return;      
    
        const px = Math.round(this.pos.x) - this.size/2;
        const py = Math.round(this.pos.y) - this.size/2;

        // TODO: Use a sprite instead
        canvas.fillRect(px, py, this.size, this.size);
    }
}


export class SnowflakeGenerator {


    private snowflakes : Array<Snowflake>;
    private flakeTimer : number = 0;


    constructor(event : ProgramEvent) {

        this.snowflakes = new Array<Snowflake> ();

        this.generateInitialFlakes(event);
    }


    private generateInitialFlakes(event : ProgramEvent) {

        const COUNT = 32;

        let x : number;
        let y : number;

        for (let i = 0; i < COUNT; ++ i) {

            x = (Math.random()*event.screenWidth)  | 0;
            y = (Math.random()*event.screenHeight) | 0;

            this.generateFlake(event, new Vector(x, y));
        }
    }


    private generateFlake(event : ProgramEvent, pos? : Vector) {

        const MAX_SIZE = 3;

        const MIN_SPEED_X : number  = 0.25;
        const MAX_SPEED_X : number  = 1.25;
        const MIN_SPEED_Y : number  = 0.25;
        const MAX_SPEED_Y : number  = 1.5;

        const speedX = MIN_SPEED_X + Math.random()*(MAX_SPEED_X - MIN_SPEED_X);
        const speedY = MIN_SPEED_Y + Math.random()*(MAX_SPEED_Y - MIN_SPEED_Y);
        
        const dx = pos?.x ?? ((Math.random()*event.screenWidth) | 0);
        const dy = pos?.y ?? -2;

        (next(this.snowflakes, Snowflake) as Snowflake)
            .spawn(dx, dy, speedX, speedY, 1 + ((Math.random()*MAX_SIZE) | 0));
    }


    public update(camera : Camera, event : ProgramEvent) : void {

        const FLAKE_GEN_TIME : number = 12;

        if ((this.flakeTimer += event.tick) >= FLAKE_GEN_TIME) {

            this.generateFlake(event);
            this.flakeTimer -= FLAKE_GEN_TIME;
        }

        if (camera.isMoving()) {

            for (let o of this.snowflakes) {

                o.cameraEvent(camera);
            }
        }
        else {

            for (let o of this.snowflakes) {

                o.update(event);
            }
        }
    }


    public draw(canvas : Canvas, color : RGBA, alpha : number = 0.67) : void {

        canvas.setColor(color.r, color.g, color.b, alpha);
        for (let o of this.snowflakes) {

            o.draw(canvas);
        }
        canvas.setColor();
    }
}
