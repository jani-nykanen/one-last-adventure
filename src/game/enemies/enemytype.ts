import { clamp } from "../../math/utility.js";
import { Slime } from "./slime.js"
import { Rabbit } from "./rabbit.js"
import { Turtle } from "./turtle.js"


const ENEMY_TYPES : Function[] = [Slime, Rabbit, Slime, Turtle];


export const getEnemyType = (id : number) => ENEMY_TYPES[clamp(id, 0, ENEMY_TYPES.length-1)];
