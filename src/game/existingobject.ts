


export interface ExistingObject {


    doesExist() : boolean;
    isDying() : boolean;

    forceKill() : void;
}



export function next(arr : ExistingObject[], type : Function) : ExistingObject {

    for (let o of arr) {

        if (!o.doesExist()) {

            return o;
        }
    }

    let o = new type.prototype.constructor();
    arr.push(o);

    return o;
}
