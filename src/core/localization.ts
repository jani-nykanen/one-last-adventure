



export class Localization {


    private jsonData : any; // Sniff


    constructor(jsonSource : string) {

        this.jsonData = JSON.parse(jsonSource);

        console.log(this.jsonData);
    }


    public getItem(key : string) : string | string[] | undefined {

        const item = this.jsonData[key];

        if (item?.["length"] !== undefined) {

            return item as string[];
        }

        if (typeof(item) === "string") {

            return item as string;
        }

        return undefined;
    }
}
