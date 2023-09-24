import { clamp } from "../../math/utility.js";
import { Slime } from "./slime.js"



const ENEMY_TYPES : Function[] = [Slime];


export const getEnemyType = (id : number) => ENEMY_TYPES[clamp(id, 0, ENEMY_TYPES.length-1)];
