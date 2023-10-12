import { clamp } from "../../math/utility.js";
import { Slime } from "./slime.js";
import { Rabbit } from "./rabbit.js";
import { Turtle } from "./turtle.js";
import { Caterpillar } from "./catepillar.js";
import { Apple } from "./apple.js";


const ENEMY_TYPES : Function[] = [Slime, Rabbit, Caterpillar, Turtle, Apple];


export const getEnemyType = (id : number) => ENEMY_TYPES[clamp(id, 0, ENEMY_TYPES.length-1)];
