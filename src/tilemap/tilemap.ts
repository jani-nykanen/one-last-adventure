//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: tilemap
// File: tilemap.ts
// Comment: base tilemap type & parsing
//


export class Tilemap {

    // TODO: Check the first tile index from a tilemap, then substitute?

    private tileLayers : Map<string, number[]>;
    private properties : Map<string, string>;

    public readonly width : number;
    public readonly height : number;


    constructor(xmlString : string) {

        const doc = (new DOMParser()).parseFromString(xmlString, "text/xml");
        const root = doc.getElementsByTagName("map")[0];

        this.width = Number(root.getAttribute("width"));
        this.height = Number(root.getAttribute("height"));

        this.parseLayerData(root);
        this.parseProperties(root);
    }


    private parseLayerData(root : HTMLMapElement) : void {

        this.tileLayers = new Map<string, number[]> ();

        const data = root.getElementsByTagName("layer");
        if (data === null) {

            return;
        }

        let content : Array<string> | undefined;
        for (let i = 0; i < data.length; ++ i) {

            // I guess this beats typecasting to any...
            content = data[i].getElementsByTagName("data")[0]?.
                childNodes[0]?.
                nodeValue?.
                replace(/(\r\n|\n|\r)/gm, "")?.
                split(",");
            if (content === undefined)
                continue;

            this.tileLayers.set(data[i].getAttribute("name"), content.map((v : string) => Number(v)));
        }
    }   


    private parseProperties(root : HTMLMapElement) : void {

        this.properties = new Map<string, string> ();

        const prop = root.getElementsByTagName("properties")[0];

        let elements : HTMLCollectionOf<Element>;;
        let p : Element;

        if (prop !== undefined) {

            elements = prop.getElementsByTagName("property");
            for (let i = 0; i < elements.length; ++ i) {

                p = elements[i];
                if (p.getAttribute("name") != undefined) {

                    this.properties.set(
                        p.getAttribute("name") ?? "null", 
                        p.getAttribute("value") ?? "null");
                }
            }
        } 
    }


    public getTile(layerName : string, x : number, y : number, def = -1) : number {

        const layer = this.tileLayers.get(layerName);
        if (layer === undefined || 
            x < 0 || y < 0 || x >= this.width || y >= this.height)
            return def;

        return layer[y * this.width + x];
    }


    public getIndexedTile = (layerName : string, i : number, def = -1) : number => 
        this.getTile(layerName, i % this.width, (i / this.width) | 0, def);


    public cloneLayer(layerName : string) : Array<number> | undefined {

        const layer = this.tileLayers.get(layerName);
        if (layer === undefined)
            return null;

        return Array.from(layer);
    }


    public getProperty(name : string) : string | undefined {

        for (let [key, value] of this.properties) {

            if (key == name)
                return value;
        }
        return undefined;
    }
    
}