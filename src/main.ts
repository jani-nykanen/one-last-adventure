import { ProgramEvent } from "./core/event";
import { Program } from "./core/program.js";
import { WebGLRenderer } from "./gfx/webgl/renderer.js";
import { Game } from "./game/game.js";


const initialEvent = (event : ProgramEvent) : void => {

    event.scenes.addScene("game", new Game())

    event.assets.parseIndexFile("assets/index.json");

    event.input.addAction("jump", ["Space", "KeyZ"], [0]);
    event.input.addAction("attack", ["LeftControl", "KeyX"], [2]);
}


const onloadEvent = (event : ProgramEvent) : void => {
    
}


window.onload = () => (new Program(240, 160, WebGLRenderer))
    .run(initialEvent, onloadEvent);
