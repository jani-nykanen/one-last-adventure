import { ProgramEvent } from "../core/event.js";
import { Align, Canvas, Flip } from "../gfx/interface.js";
import { drawUIBox } from "../ui/box.js";
import { ConfirmationBox } from "../ui/confirmationbox.js";
import { Menu } from "../ui/menu.js";
import { MenuButton } from "../ui/menubutton.js";
import { TextBox } from "../ui/textbox.js";
import { ProgressManager } from "./progress.js";



const ITEM_PRICES : number[] = [

    5, // Health up
    25, // Magic up
    50, // Attack up
    50, // Magic attack up
    75, // Rapid attack
    100, // Armor
];



export class Shop {


    private active : boolean = false;

    private failMessage : TextBox;
    private confirmBox : ConfirmationBox;
    private description : TextBox;

    private menu : Menu;

    private shopTitle : string = "";

    private failMessageText : string;
    private confirmText : string;

    private readonly progress : ProgressManager;


    constructor(progress : ProgressManager, event : ProgramEvent) {

        this.menu = new Menu(this.createMenuButtons(event), true, true, 24); 
        this.description = new TextBox(true, 24, 3);

        this.description.addText([""]);
        this.description.activate(true);

        const strYes = event.localization?.getItem("yes")?.[0] ?? "null";
        const strNo = event.localization?.getItem("no")?.[0] ?? "null";

        this.confirmBox = new ConfirmationBox([strYes, strNo], 
            "null",
            (event : ProgramEvent) => {

                this.deactivate();
            },
            (event : ProgramEvent) => {

                this.confirmBox.deactivate();
            });

        this.shopTitle = event.localization?.getItem("shop")[0] ?? "null";
        this.failMessageText = event.localization?.getItem("nomoney")[0] ?? "null";
        this.confirmText = event.localization?.getItem("shop_confirm")[0] ?? "null";

        this.failMessage = new TextBox();

        this.progress = progress;
    }


    private createMenuButtons(event : ProgramEvent) : MenuButton[] {

        const buttons = new Array<MenuButton> ();

        const buttonText = event.localization?.getItem("shop_menu") ?? [];

        for (let i = 0; i < buttonText.length - 1; ++ i) {

            buttons.push(new MenuButton(
                buttonText[i], (event : ProgramEvent) => {

                    const coins = this.progress.getProperty("coins");
                    if (coins < ITEM_PRICES[i]) {

                        this.failMessage.addText([this.failMessageText]);
                        this.failMessage.activate(true);
                    }
                    else {

                        this.confirmBox.changeText(this.confirmText.replace("%", String(ITEM_PRICES[i])));
                        this.confirmBox.activate(1);
                    }
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


    private darken(canvas : Canvas) : void {

        canvas.setColor(0, 0, 0, 0.50);
        canvas.fillRect();
        canvas.setColor();
    }


    public update(event : ProgramEvent) : void {

        if (!this.active)   
            return;

        if (this.confirmBox.isActive()) {

            this.confirmBox.update(event);
            return;
        }

        if (this.failMessage.isActive()) {

            this.failMessage.update(event);
            return;
        }

        this.menu.update(event);

        const cpos = this.menu.getCursorPos();

        const text = event.localization?.getItem("shop_item_desc") ?? [];

        const newText = cpos == this.menu.getButtonCount()-1 ? "" : (text[cpos] ?? "null");
        this.description.forceChangeText(newText);
    }


    public draw(canvas : Canvas) : void {

        const MENU_YOFF : number = 12;

        if (!this.active)
            return;

        const buttonCount = this.menu.getButtonCount();

        const font = canvas.getBitmap("font");
        const bmpHUD = canvas.getBitmap("hud");
        const bmpItems = canvas.getBitmap("items");

        this.darken(canvas);

        drawUIBox(canvas, canvas.width/2 - 32, 4, 64, 16);
        canvas.drawText(font, this.shopTitle, canvas.width/2, 8, 0, 0, Align.Center);

        this.menu.draw(canvas, 0, -12, MENU_YOFF);
        this.description.draw(canvas, 0, 56, 2, true, false);

        const dx = canvas.width/2 + 56;
        let dy : number;
        for (let i = 0; i < buttonCount - 1; ++ i) {

            dy = 24 + i*12;

            canvas.drawBitmap(bmpHUD, Flip.None, dx, dy, 32, 0, 16, 16);
            canvas.drawText(font, String(ITEM_PRICES[i]), dx + 14, dy + 4);
        }

        const cpos = this.menu.getCursorPos();
        if (cpos < buttonCount - 1) {

            canvas.drawBitmap(bmpItems, Flip.None, canvas.width/2 + 72, canvas.height/2 + 48, cpos*16, 16, 16, 16);
        }

        if (this.failMessage.isActive()) {

            this.darken(canvas);
            this.failMessage.draw(canvas);
        }

        if (this.confirmBox.isActive()) {

            this.darken(canvas);
            this.confirmBox.draw(canvas);
        }
    }


    public activate() : void {

        this.active = true;

        this.menu.activate(-1);
        this.confirmBox.deactivate();
        this.failMessage.deactivate();
    }


    public deactivate() : void {

        this.active = false;
    }


    public isActive = () : boolean => this.active;

}
