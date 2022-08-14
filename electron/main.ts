import {app, BrowserWindow, screen, ipcMain, dialog,shell } from 'electron'
import {MainMenu} from './menu'
import path from 'path'
import { info, reloadPage } from './utils'
import { factory } from 'electron-json-config'
import fs from 'fs'
import {download} from 'electron-dl';
import { upgradeHandle } from './upgrade'

let mainWin:BrowserWindow | null
const mainMenu = new MainMenu([
    {
        label: '快速重启',
        accelerator: 'F5',
        click: () => {
            reloadPage(mainWin)
        }
    },
    {
        label: '浏览器调试',
        role: 'toggleDevTools'
    },
    {
        label: "关于",
        click: () => {
            info()
        }
    },
    {
        label: "退出",
        click: () => {
            app.quit()
        }
    }
])


app.on('ready', () => {
    mainMenu.createMainMenu()
 

    const {width,height} = screen.getPrimaryDisplay().workAreaSize

    mainWin = new BrowserWindow({
        width: width,
        height: height,
        show: false,
        webPreferences: {
            webSecurity: false, //解决跨域
            // contextIsolation:false,
            preload: path.join(__dirname,'preload.js')
        }
    })

    if (process.env.npm_lifecycle_event == 'electron') {
        // mainWin.loadURL('http://localhost:3000')  
        mainWin.loadURL('http://www.diygw.com')  
        // upgradeHandle(mainWin, process.env.VUE_APP_UPLOAD) //检测版本更新
        // mainWin.webContents.openDevTools({
        //     mode:'bottom'
        // })
    } else {
        mainWin.loadURL('http://www.diygw.com')
        upgradeHandle(mainWin, process.env.VUE_APP_UPLOAD) //检测版本更新
        // mainWin.loadFile('dist/index.html')
    }

    mainWin.once('ready-to-show', ()=>{
        mainWin && mainWin.show()
    })



    mainWin.on('close', () => {
        mainWin = null
    })

    mainWin.webContents.setWindowOpenHandler(data =>{
        return {
            action: "allow", overrideBrowserWindowOptions: {
                width: width,
                height: height,
                webPreferences: {
                    webSecurity: false, //解决跨域
                    preload: path.join(__dirname,'preload.js')
                    // contextIsolation: false,
                    // nodeIntegration: true
                }
            }
        };
    });
 
    // mainWin.webContents.on('new-window', function(e, url) {
    //     e.preventDefault();
    //     shell.openExternal(url);
    // })
   
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

 
const dbconfig = factory()
let uniappwin:BrowserWindow | null
// //是否重新加载窗口
ipcMain.on('app-open-uniapp', function (event: any, config: any) {
  const data: any = dbconfig.get(config.id)
  if (data.url) {
    uniappwin = new BrowserWindow({
      width: 380,
      height: 680,
      center: true
    })
    uniappwin.loadURL(data.url)
    uniappwin.on('closed', () => {
      uniappwin = null
    })
  } else {
    dialog.showMessageBox({
      type: 'warning',
      title: '警告',
      buttons: ['确定'],
      message: '请先配置本地调试地址',
      noLink: true
    })
  }
})

// 主进程
ipcMain.handle('app-get-config', async (event: any, id) => {
  const data = dbconfig.get(id)
  console.log('app-get-config' + data)
  return data
})

ipcMain.on('app-download', function (e, url) {
    e.preventDefault();
    shell.openExternal(url);
});

ipcMain.handle('app-select-dir', async (event: any, type) => {
  console.log(type)
  const filePaths = dialog.showOpenDialogSync({
    properties: ['openDirectory', 'createDirectory']
  })
  if (!filePaths) {
    return null
  }
  if (type === 'uniapp') {
    const pagefile = filePaths[0] + '/pages.json'
    if (fs.existsSync(pagefile)) {
      return filePaths[0]
    } else {
      return 'error'
    }
  } else if (type === 'h5') {
    return filePaths[0]
  } else {
    const pagefile = filePaths[0] + '/app.json'
    if (fs.existsSync(pagefile)) {
      return filePaths[0]
    } else {
      return 'error'
    }
  }
})
 
// 主进程
ipcMain.handle('app-set-config', async (event: any, config: any) => {
  dbconfig.set(config.id, config)
  return true
})


ipcMain.on('app-down-file', async (event, {url}) => {
    const win:any = BrowserWindow.getFocusedWindow();
    console.log(await download(win, url,{
        saveAs:true
    }));
});

ipcMain.on('vue', (event,data)=>{
    event.reply('electron','来自主进程的信息')
})