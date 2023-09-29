//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: audio
// File: sample.ts
// Comment: audio player
//


import { AudioSample } from "./sample.js";


export class AudioPlayer {

    protected ctx : AudioContext | undefined = undefined;
    private musicTrack : AudioSample | undefined = undefined;

    private globalVolume : number;
    private enabled : boolean = false;


    constructor(globalVolume = 1.0) {

        // NOTE: On one specific browser that might or might not
        // be Safari, audio context has to be created in user input,
        // possibly even in the event handler itself. Since I don't have
        // an Apple device, I have no way to debug this, so for now I just
        // assume that people are not using Safari in the first place... 
        // I do need to fix this at some point, though.

        this.ctx = new AudioContext();
        this.globalVolume = globalVolume;
    }


    public playSample(sample : AudioSample | undefined, vol : number = 1.0) : void {

        const EPS : number = 0.001;

        if (this.ctx === undefined ||
            !this.enabled || 
            sample === undefined || 
            this.globalVolume*vol <= EPS) {

            return;
        }

        sample.play(this.ctx, this.globalVolume*vol, false, 0);
    }


    public playMusic(sample : AudioSample | undefined, vol : number = 1.0) : void {

        if (!this.enabled || sample === undefined) 
            return;

        this.fadeInMusic(sample, vol, 0.0);
    }


    public fadeInMusic(sample : AudioSample | undefined, vol : number = 1.0, fadeTime : number = 0.0) {

        const EPS = 0.001;

        if (this.ctx === undefined ||
            !this.enabled || this.globalVolume <= EPS) 
            return;

        if (this.musicTrack !== undefined) {

            this.musicTrack.stop();
            this.musicTrack = undefined;
        }

        const v = this.globalVolume*vol;
        sample?.fadeIn(this.ctx, fadeTime == null ? v : 0.01, v, true, 0, fadeTime);
        this.musicTrack = sample;
    }


    public pauseMusic() : void {

        if (this.ctx === undefined ||
            !this.enabled || this.musicTrack === undefined)
            return;

        this.musicTrack.pause(this.ctx);
    }


    public resumeMusic() : boolean {

        if (this.ctx === undefined ||
            !this.enabled || this.musicTrack === undefined)
            return false;

        this.musicTrack.resume(this.ctx);
        
        return true;
    }


    public stopMusic() : void {

        if (!this.enabled || this.musicTrack === undefined)
            return;

        this.musicTrack.stop();
        this.musicTrack = undefined;
    }


    public toggle(state : boolean = !this.enabled) : boolean {

        this.enabled = state;
        return this.enabled;
    }


    public setGlobalVolume(vol : number) : void {

        this.globalVolume = vol;
    }


    public isEnabled = () : boolean => this.enabled;


    public getStateString = () : string => "Audio: " + ["Off", "On"][Number(this.enabled)]; 


    public decodeSample(sampleData : ArrayBuffer, callback : (s : AudioSample) => any) : void {

        if (this.ctx === undefined)
            return;

        this.ctx.decodeAudioData(sampleData, (data : AudioBuffer) => {

            // I know that this.ctx cannot be undefined at this point, but vscode apparently
            // does not, thus the type conversion
            callback(new AudioSample(this.ctx as AudioContext, data));
        });
    }
}
