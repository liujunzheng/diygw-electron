import {Menu, MenuItemConstructorOptions} from 'electron'

abstract class AppMenu {
    protected menuTemp:MenuItemConstructorOptions[] 

    constructor(menuTemp:MenuItemConstructorOptions[]) {
        this.menuTemp = menuTemp
    }
}

export class MainMenu extends AppMenu {
    constructor(menuTemp:MenuItemConstructorOptions[]) {
        super(menuTemp)
    }

    createMainMenu() {
        const menu = Menu.buildFromTemplate(this.menuTemp)
        Menu.setApplicationMenu(menu)
    }
}
