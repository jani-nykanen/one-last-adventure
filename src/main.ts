import { ProgramEvent } from "./core/event";
import { Program } from "./core/program.js";
import { WebGLRenderer } from "./gfx/webgl/renderer.js";
import { Game } from "./game/game.js";


const initialEvent = (event : ProgramEvent) : void => {

    event.scenes.addScene("game", new Game())
}


const onloadEvent = (event : ProgramEvent) : void => {
    
}


window.onload = () => (new Program(240, 160, WebGLRenderer))
    .run(initialEvent, onloadEvent);
