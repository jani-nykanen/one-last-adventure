//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: core
// File: assets.ts
// Comment: assets manager
//


import { AudioSample } from "../audio/sample.js";
import { Tilemap } from "../tilemap/tilemap.js";
import { AudioPlayer } from "../audio/audioplayer.js";
import { Renderer, Bitmap } from "../gfx/interface.js";


export class Assets {


    private bitmaps : Map<string, Bitmap>;
    private samples : Map<string, AudioSample>;
    private tilemaps : Map<string, Tilemap>;

    private loaded : number = 0;
    private totalAssets : number = 0;

    private readonly audio : AudioPlayer;
    private readonly renderer : Renderer;


    constructor(audio : AudioPlayer, renderer : Renderer) {

        this.bitmaps = new Map<string, Bitmap> ();
        this.samples = new Map<string, AudioSample> ();
        this.tilemaps = new Map<string, Tilemap> ();

        this.audio = audio;
        this.renderer = renderer;
    }


    private loadTextFile(path : string, type : string, func : (s : string) => void) : void {
        
        ++ this.totalAssets;

        const xobj = new XMLHttpRequest();
        xobj.overrideMimeType("text/" + type);
        xobj.open("GET", path, true);

        xobj.onreadystatechange = () => {

            if (xobj.readyState == 4 ) {

                if(String(xobj.status) == "200") {
                    
                    func(xobj.responseText);
                }
                ++ this.loaded;
            }
                
        };
        xobj.send(null);  
    }


    private loadItems(jsonData : any,
        func : (name : string, path : string, extraParam? : string) => void, 
        basePathName : string, arrayName : string) : void {
        
        const path : string | undefined = jsonData[basePathName];
        const objects : any | undefined = jsonData[arrayName];

        if (path !== undefined && objects !== undefined) {
                    
            for (let o of objects) {

                func(o["name"], path + o["path"]);
            }
        }
    }


    public loadBitmap(name : string, path : string) : void {

        ++ this.totalAssets;

        const image = new Image();
        image.onload = (_ : Event) => {

            ++ this.loaded;
            this.bitmaps.set(name, this.renderer.createBitmap(image));
        }
        image.src = path;
    }


    public loadTilemap(name : string, path : string) : void {

        ++ this.totalAssets;
        
        this.loadTextFile(path, "xml", (str : string) => {

            this.tilemaps.set(name, new Tilemap(str));
            ++ this.loaded;
        });
    }


    public loadSample(name : string, path : string) : void {

        ++ this.totalAssets;

        const xobj = new XMLHttpRequest();
        xobj.open("GET", path, true);
        xobj.responseType = "arraybuffer";

        xobj.onload = () => {

            if (xobj.readyState == 4 ) {
                this.audio.decodeSample(xobj.response, (sample : AudioSample) => {
                    
                    ++ this.loaded;
                    this.samples.set(name, sample);
                });
            }
        }
        xobj.send(null);
    }



    public parseIndexFile(path : string) : void {

        this.loadTextFile(path, "json", (s : string) => {

            let data = JSON.parse(s);

            this.loadItems(data, (name : string, path : string) => {
                this.loadBitmap(name, path);
            }, "bitmapPath", "bitmaps");

            this.loadItems(data, (name : string, path : string) => {
                this.loadTilemap(name, path);
            }, "tilemapPath", "tilemaps");

            this.loadItems(data, (name : string, path : string) => {
                this.loadSample(name, path);
            }, "samplePath", "samples");
        });
    }


    public hasLoaded = () : boolean => this.loaded >= this.totalAssets;


    public getBitmap(name : string) : Bitmap | undefined {

        return this.bitmaps.get(name);
    }


    public getSample(name : string) : AudioSample | undefined {

        return this.samples.get(name);
    }


    public getTilemap(name : string) : Tilemap | undefined {

        return this.tilemaps.get(name);
    }


    // In range [0,1], actually...
    public getLoadingPercentage = () : number => this.totalAssets == 0 ? 1.0 : this.loaded / this.totalAssets;

}