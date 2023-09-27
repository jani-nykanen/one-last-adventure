import { ProgramEvent } from "./core/event";
import { Program } from "./core/program.js";
import { WebGLRenderer } from "./gfx/webgl/renderer.js";
import { Game } from "./game/game.js";


const initialEvent = (event : ProgramEvent) : void => {

    event.scenes.addScene("game", new Game())

    event.assets.parseIndexFile("assets/index.json");

    event.input.addAction("jump", ["Space", "KeyZ"], [0]);
    // event.input.addAction("attack", ["ControlLeft", "KeyX"], [2]);
    event.input.addAction("attack", ["KeyX"], [2]);
    event.input.addAction("pause", ["Enter"], [7]);
    event.input.addAction("select", ["Enter", "Space", "KeyZ"], [0, 7]);
}


const onloadEvent = (event : ProgramEvent) : void => {

    const loc = event.assets.getDocument("en-us");
    if (loc !== undefined) {

        event.addLocalizationJSON("en-us", loc);
        event.setActiveLocalization("en-us");
    }
}


window.onload = () => (new Program(240, 160, WebGLRenderer))
    .run(initialEvent, onloadEvent);
