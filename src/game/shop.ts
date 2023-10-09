import { ProgramEvent } from "../core/event.js";
import { Align, Canvas } from "../gfx/interface.js";
import { drawUIBox } from "../ui/box.js";
import { ConfirmationBox } from "../ui/confirmationbox.js";
import { Menu } from "../ui/menu.js";
import { MenuButton } from "../ui/menubutton.js";
import { TextBox } from "../ui/textbox.js";



export class Shop {


    private active : boolean = false;

    private failMessage : TextBox;
    private confirmBox : ConfirmationBox;
    private description : TextBox;

    private menu : Menu;

    private shopTitle : string = "";


    constructor(event : ProgramEvent) {

        this.menu = new Menu(this.createMenuButtons(event), true, true, 24); 
        this.description = new TextBox(true, 24, 3);

        this.description.addText([""]);
        this.description.activate(true);

        // this.confirmBox = new ConfirmationBox([])

        this.shopTitle = event.localization?.getItem("shop")[0] ?? "null";
    }


    private createMenuButtons(event : ProgramEvent) : MenuButton[] {

        const buttons = new Array<MenuButton> ();

        const buttonText = event.localization?.getItem("shop_menu") ?? [];

        for (let i = 0; i < buttonText.length - 1; ++ i) {

            buttons.push(new MenuButton(
                buttonText[i], (event : ProgramEvent) => {

                    // TODO: This
                }
            ));
        }
        buttons.push(new MenuButton(
            buttonText[buttonText.length - 1], (event : ProgramEvent) => {

                this.deactivate();
            }
        ));

        return buttons;
    }


    public update(event : ProgramEvent) : void {

        if (!this.active)   
            return;

        this.menu.update(event);

        const cpos = this.menu.getCursorPos();

        const text = event.localization?.getItem("shop_item_desc") ?? [];

        const newText = cpos == this.menu.getButtonCount()-1 ? "" : (text[cpos] ?? "null");
        this.description.forceChangeText(newText);
    }


    public draw(canvas : Canvas) : void {

        if (!this.active)
            return;

        const font = canvas.getBitmap("font");

        canvas.setColor(0, 0, 0, 0.50);
        canvas.fillRect();
        canvas.setColor();

        drawUIBox(canvas, canvas.width/2 - 32, 4, 64, 16);
        canvas.drawText(font, this.shopTitle, canvas.width/2, 8, 0, 0, Align.Center);

        this.menu.draw(canvas, 0, -12);
        this.description.draw(canvas, 0, 56, 2, true, false);
    }


    public activate() : void {

        this.active = true;

        this.menu.activate(-1);
        // this.confirmBox.deactivate();
        // this.failMessage.deactivate();
    }


    public deactivate() : void {

        this.active = false;
    }


    public isActive = () : boolean => this.active;

}
