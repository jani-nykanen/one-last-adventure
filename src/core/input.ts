//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: core
// File: input.ts
// Comment: a generic input manager
//


import { InputState } from "./inputstate.js";
import { Keyboard } from "./keyboard.js";
import { GamePad } from "./gamepad.js";
import { Vector } from "../math/vector.js";


const INPUT_DIRECTION_DEADZONE : number = 0.1;


class InputAction {


    public keys : Array<string>;
    public gamepadButtons : Array<number>;


    constructor(keys : Array<string>,  gamepadButtons : Array<number>) {

        this.keys = Array.from(keys);
        this.gamepadButtons = Array.from(gamepadButtons);
    }
}


export class Input {


    private actions : Map<string, InputAction>;

    private oldStick : Vector;
    private vstick : Vector;
    private stickDelta : Vector;

    public readonly keyboard : Keyboard;
    public readonly gamepad : GamePad;


    public get stick() : Vector {

        return this.vstick.clone();
    }


    constructor() {

        this.actions = new Map<string, InputAction> ();

        this.vstick = new Vector();
        this.oldStick = new Vector();
        this.stickDelta = new Vector();

        this.keyboard = new Keyboard();
        this.gamepad = new GamePad();
    }


    public addAction(name : string, keys : Array<string>, gamepadButtons? : Array<number>) : void {

        this.actions.set(name, new InputAction(keys, gamepadButtons ?? []));
    }


    public updateStick() : void {

        const DEADZONE = 0.25;

        this.oldStick = this.vstick.clone();
        this.vstick.zeros();

        let stick = new Vector();

        if ((this.keyboard.getKeyState("ArrowLeft") & InputState.DownOrPressed) == 1 ||
            (this.gamepad.getButtonState(14) & InputState.DownOrPressed) == 1) {

            stick.x = -1;
        }
        else if ((this.keyboard.getKeyState("ArrowRight") & InputState.DownOrPressed) == 1  ||
            (this.gamepad.getButtonState(15) & InputState.DownOrPressed) == 1) {

            stick.x = 1;
        }
        if ((this.keyboard.getKeyState("ArrowUp") & InputState.DownOrPressed) == 1  ||
            (this.gamepad.getButtonState(12) & InputState.DownOrPressed) == 1) {

            stick.y = -1;
        }
        else if ((this.keyboard.getKeyState("ArrowDown") & InputState.DownOrPressed) == 1  ||
            (this.gamepad.getButtonState(13) & InputState.DownOrPressed) == 1) {

            stick.y = 1;
        }

        if (stick.length < DEADZONE) {

            stick = this.gamepad.stick;
        }
        
        if (stick.length >= DEADZONE) {

            this.vstick = stick;
        }

        this.stickDelta.x = this.vstick.x - this.oldStick.x;
        this.stickDelta.y = this.vstick.y - this.oldStick.y;
    }


    public update() : void {

        this.keyboard.update();
        this.gamepad.update();
    }


    public getAction(name : string) : InputState {

        let action = this.actions.get(name);
        if (action === undefined)
            return InputState.Up;

        let state = InputState.Up;
        for (let k of action.keys) {

            state = this.keyboard.getKeyState(k);
            if (state != InputState.Up)
                return state;
        }

        for (let b of action.gamepadButtons) {

            state = this.gamepad.getButtonState(b);
            if (state != InputState.Up)
                return state;
        }
        return state;
    }


    public upPress() : boolean {

        return this.stick.y < 0 && 
            this.oldStick.y >= -INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.y < -INPUT_DIRECTION_DEADZONE;
    }


    public downPress() : boolean {

        return this.stick.y > 0 && 
            this.oldStick.y <= INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.y > INPUT_DIRECTION_DEADZONE;
    }


    public leftPress() : boolean {

        return this.stick.x < 0 && 
            this.oldStick.x >= -INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.x < -INPUT_DIRECTION_DEADZONE;
    }

    
    public rightPress() : boolean {

        return this.stick.x > 0 && 
            this.oldStick.x <= INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.x > INPUT_DIRECTION_DEADZONE;
    }


    public anyPressed = () : boolean => this.keyboard.isAnyPressed() || this.gamepad.isAnyPressed();
}
