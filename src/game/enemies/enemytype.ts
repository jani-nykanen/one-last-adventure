import { clamp } from "../../math/utility.js";
import { Slime } from "./slime.js";
import { Rabbit } from "./rabbit.js";
import { Turtle } from "./turtle.js";
import { Caterpillar } from "./caterpillar.js";
import { Apple } from "./apple.js";
import { Miner } from "./miner.js";
import { Bat } from "./bat.js";
import { Bee } from "./bee.js";
import { PinkThing } from "./pinkthing.js";
import { Brick } from "./brick.js";
import { Ball } from "./ball.js";
import { Plant } from "./plant.js";
import { Bull } from "./bull.js";
import { Star } from "./star.js";
import { GiantBat } from "./giantbat.js";
import { Ufo } from "./ufo.js";


const ENEMY_TYPES : Function[] = [Slime, Rabbit, Caterpillar, Turtle, Apple, Miner, Bat, PinkThing, Bee, Brick, Ball, Plant, Bull, Star, GiantBat, Ufo];


export const getEnemyType = (id : number) => ENEMY_TYPES[clamp(id, 0, ENEMY_TYPES.length-1)];
