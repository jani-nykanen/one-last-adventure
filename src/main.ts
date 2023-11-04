import { ProgramEvent } from "./core/event.js";
import { Program } from "./core/program.js";
import { WebGLRenderer } from "./gfx/webgl/renderer.js";
import { Game } from "./game/game.js";
import { Ending } from "./game/ending.js";
import { AudioIntro } from "./game/audiointro.js";
import { TitleScreen } from "./game/titlescreen.js";
import { constructMapTexture } from "./game/maptexture.js";
import { Intro } from "./game/intro.js";


const initialEvent = (event : ProgramEvent) : void => {

    event.scenes.addScene("game", new Game(), false);
    event.scenes.addScene("titlescreen", new TitleScreen(), false);
    event.scenes.addScene("ending", new Ending(), false);
    event.scenes.addScene("intro", new Intro(), false);
    event.scenes.addScene("audiointro", new AudioIntro(), true);

    event.assets.parseIndexFile("assets/index.json");

    event.input.addAction("jump", ["Space", "KeyZ"], [0]);
    event.input.addAction("attack", ["KeyX", "ControlLeft"], [2]);
    event.input.addAction("magic", ["KeyC", "ShiftLeft"], [1]);
    // event.input.addAction("attack", ["KeyX"], [2]);
    event.input.addAction("pause", ["Enter"], [7]);
    event.input.addAction("select", ["Enter", "Space", "KeyZ"], [0, 7]);
    event.input.addAction("map", ["ShiftRight", "KeyM"], [6]);

    event.audio.setGlobalVolume(0.60);
}


const onloadEvent = (event : ProgramEvent) : void => {

    const loc = event.assets.getDocument("en-us");
    if (loc !== undefined) {

        event.addLocalizationJSON("en-us", loc);
        event.setActiveLocalization("en-us");
    }

    const islandMap = constructMapTexture("island", event);
    const cavesMap = constructMapTexture("caves", event);

    event.assets.addBitmap("island_map", islandMap);
    event.assets.addBitmap("caves_map", cavesMap);
}


window.onload = () => (new Program(240, 160, WebGLRenderer))
    .run(initialEvent, onloadEvent);
