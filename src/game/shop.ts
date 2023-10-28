import { ProgramEvent } from "../core/event.js";
import { Align, Canvas, Flip } from "../gfx/interface.js";
import { drawUIBox } from "../ui/box.js";
import { ConfirmationBox } from "../ui/confirmationbox.js";
import { Menu } from "../ui/menu.js";
import { MenuButton } from "../ui/menubutton.js";
import { TextBox } from "../ui/textbox.js";
import { Player, SpecialPlayerAnimationType } from "./player.js";
import { ProgressManager } from "./progress.js";



const ITEM_PRICES : number[] = [

    30, // Health up
    30, // Magic up
    75, // Attack up
    75, // Magic attack up
    100, // Armor 
    75, // Rapid attack
    50, // Better pick ups
];



export class Shop {


    private active : boolean = false;

    private failMessage : TextBox;
    private confirmBox : ConfirmationBox;
    private description : TextBox;

    private menu : Menu;

    private shopTitle : string = "";
    private buttonText : string[] = [];

    private failMessageText : string;
    private confirmText : string;
    private playerRef : Player | undefined = undefined; 

    private readonly progress : ProgressManager;
    private readonly genericTextbox : TextBox;

    
    constructor(progress : ProgressManager, genericTextbox : TextBox, event : ProgramEvent) {

        this.menu = new Menu(this.createMenuButtons(event), true, true, 24); 
        this.description = new TextBox(true, 24, 3);

        this.description.addText([""]);
        this.description.activate(true);

        const strYes = event.localization?.getItem("yes")?.[0] ?? "null";
        const strNo = event.localization?.getItem("no")?.[0] ?? "null";

        this.confirmBox = new ConfirmationBox([strYes, strNo], 
            "null",
            (event : ProgramEvent) => {

                const price = ITEM_PRICES[this.menu.getCursorPos()];

                this.playerRef.addCoins(-price);

                const id = this.menu.getCursorPos() + 1;

                event.audio.pauseMusic();

                this.deactivate();
                this.progress.setProperty("shopitem" + String(id), 1);
                event.audio.playSample(event.assets.getSample("item"), 0.80);

                this.playerRef?.toggleSpecialAnimation(SpecialPlayerAnimationType.HoldItem, id + 16,
                    (event : ProgramEvent) => {
        
                        const text = event.localization?.getItem("shopitem" + String(id)) ?? ["null"];

                        this.genericTextbox.addText(text);
                        this.genericTextbox.activate(false, (event : ProgramEvent) => event.audio.resumeMusic());
                    });
            },
            (event : ProgramEvent) => {

                this.confirmBox.deactivate();
            });

        this.shopTitle = event.localization?.getItem("shop")[0] ?? "null";
        this.failMessageText = event.localization?.getItem("nomoney")[0] ?? "null";
        this.confirmText = event.localization?.getItem("shop_confirm")[0] ?? "null";

        this.failMessage = new TextBox();

        this.progress = progress;
        this.genericTextbox = genericTextbox;
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


        this.buttonText = buttonText;

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

        let newText = text[cpos] ?? "null";
        if (cpos == this.menu.getButtonCount() - 1 || this.menu.isButtonDeactivated(cpos)) {

            newText = "";
        }
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

        drawUIBox(canvas, canvas.width/2 - 32, 1, 64, 16);
        canvas.drawText(font, this.shopTitle, canvas.width/2, 6, 0, 0, Align.Center);

        this.menu.draw(canvas, 0, -11, MENU_YOFF);
        this.description.draw(canvas, 0, 60, 2, true, false);

        const dx = canvas.width/2 + 56;
        let dy : number;
        for (let i = 0; i < buttonCount - 1; ++ i) {

            if (this.menu.isButtonDeactivated(i))
                continue;

            dy = 20 + i*12;

            canvas.drawBitmap(bmpHUD, Flip.None, dx, dy, 32, 0, 16, 16);
            canvas.drawText(font, String(ITEM_PRICES[i]), dx + 14, dy + 4);
        }

        const cpos = this.menu.getCursorPos();
        if (cpos < buttonCount - 1 && !this.menu.isButtonDeactivated(cpos)) {

            canvas.drawBitmap(bmpItems, Flip.None, 
                canvas.width/2 + 72, 
                canvas.height/2 + 52, 
                cpos*16, 16, 16, 16);
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


    public activate(player : Player) : void {

        this.active = true;

        this.menu.activate(-1);
        this.confirmBox.deactivate();
        this.failMessage.deactivate();

        let disable : boolean;
        for (let i = 0; i < this.menu.getButtonCount() - 1; ++ i) {

            disable = this.progress.getProperty("shopitem" + String(i + 1)) != 0;
            this.menu.toggleDeactivation(i, disable);
            this.menu.changeButtonText(i, disable ? "Sold out!" : this.buttonText[i]);
        }

        this.playerRef = player;
    }


    public deactivate() : void {

        this.active = false;
    }


    public isActive = () : boolean => this.active;

}
