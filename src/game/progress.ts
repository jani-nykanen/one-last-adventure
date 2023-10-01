


export class ProgressManager {


    private properties : Map<string, number>;


    constructor() {

        this.properties = new Map<string, number> ();

        // Default properties
        this.properties.set("maxHealth", 5);
        this.properties.set("coins", 0);
    }


    public setProperty(key : string, value : number) : void {

        this.properties.set(key, value);
    }


    public getProperty(key : string, defaultValue : number = 0) : number {

        return this.properties.get(key) ?? defaultValue;
    }


    public updateProperty(key : string, change : number) : void {

        const old = this.properties.get(key) ?? 0;

        this.properties.set(key, old + change);
    }


    public saveToLocalStorage(key : string) : boolean {

        const data = JSON.stringify(Object.fromEntries(this.properties)) as string;

        try {

            // In past Closure had problems with these, so let us do
            // things in a funny way
            window["localStorage"]["setItem"](key, data);
        }
        catch (e : any) {

            console.warn("Error saving the game: " + e["message"]);
            return false;
        }
        return true;
    }


    public loadFromLocalStorage(key : string) : boolean {

        let dataStr : string;
        let dataJson : Object;

        try {

            dataStr = window["localStorage"]["getItem"](key);
            dataJson = JSON.parse(dataStr);

            for (let k of Object.keys(dataJson)) {

                this.properties.set(k, Number(dataJson[k]));
            }
        }
        catch (e : any) {

            console.warn("Error loading the game: " + e["message"]);
            return false;
        }
        return true;
    }
}
