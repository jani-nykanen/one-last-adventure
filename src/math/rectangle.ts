//
// Project title: "A Tower for Nightmares"
// Author: Jani Nykänen
//
// Module: math
// File: rectangle.ts
// Comment: another representation for 4-component vectors,
// but component names with more suitable for representing
// rectangles
//

export class Rectangle {


    public x : number;
    public y : number;
    public w : number;
    public h : number;


    constructor(x = 0, y = 0, w = 0, h = 0) {

        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }


    public clone = () : Rectangle => new Rectangle(this.x, this.y, this.w, this.h);

}
