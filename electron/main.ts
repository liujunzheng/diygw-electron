import {app, BrowserWindow, screen, ipcMain, dialog} from 'electron'
import {MainMenu} from './menu'
import path from 'path'
import { info, reloadPage } from './utils'
import { factory } from 'electron-json-config'
import fs from 'fs'
import {download} from 'electron-dl';
import fse from 'fs-extra'

//主窗口
let mainWin:BrowserWindow | null

//顶部菜单
const mainMenu = new MainMenu([
    {
        label: '刷新',
        role: 'forceReload',
        accelerator: 'F5'
        // click: () => {
        //   app.getCu
        //     reloadPage(app.getCurrentActivityType)
        // }
    },
    {
        label: '浏览器调试',
        accelerator: 'F12',
        role: 'toggleDevTools'
    },
    {
        label: "关于",
        accelerator: 'F10',
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

    // if (process.env.npm_lifecycle_event == 'electron') {
    //     mainWin.loadURL('http://localhost:3000')  
    //     //mainWin.loadURL('https://www.diygw.com')  
    // } else {
    //     mainWin.loadURL('https://www.diygw.com')
    // }
    mainWin.loadURL('http://localhost:9091')  
    // mainWin.loadURL('https://www.diygw.com')  

    mainWin.once('ready-to-show', ()=>{
        mainWin && mainWin.show() 
        mainWin?.maximize()
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
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

//设置全局配置文件 
const dbconfig = factory()

//打开uniapp调试窗口
let uniappwin:BrowserWindow | null
// //是否重新加载窗口
ipcMain.on('diygw-open-uniapp', function (event: any, config: any) {
  const data: any = dbconfig.get(config.id)
  if (data.url) {
    if(!uniappwin){
      uniappwin = new BrowserWindow({
        width: config.width||388,
        height: config.height||680,
        center: true
      })
      uniappwin.on('closed', () => {
        uniappwin = null
      })
    }
    let url = data.url
    if (url.indexOf('#') > 0) {
      url = url.substring(0, url.indexOf('#'))
    }
    uniappwin.loadURL(url + '#/pages/' + config.page)
    uniappwin.setAlwaysOnTop(true,'floating')
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


// 切换页面刷新页面
ipcMain.on('diygw-change-uniapp', function (event: any, config: any) {
  const data: any = dbconfig.get(config.id)
  if (data.url && uniappwin) {
    const projectpath = data['uniapp'] + '/pages/'
    const pagefile = projectpath + config.page + '.vue'
    if (!fse.existsSync(pagefile)) {
      //给渲染进程发送消息
      mainWin?.webContents.send('message', { cmd: 'no-file-exist' })
      return
    }
    let url = data.url
    if (url.indexOf('#') > 0) {
      url = url.substring(0, url.indexOf('#'))
    }
    uniappwin.loadURL(url + '#/pages/' + config.page)
    uniappwin.setAlwaysOnTop(true,'floating')
  }
})

// 获取配置
ipcMain.handle('diygw-get-config', async (event: any, id) => {
  const data = dbconfig.get(id)
  return data
})


// 获取当前源码配置的目录
ipcMain.handle('diygw-select-dir', async (event: any, config:any) => {
  const filePaths = dialog.showOpenDialogSync({
    properties: ['openDirectory', 'createDirectory']
  })
  if (!filePaths) {
    return null
  }
  //判断是否移动端配置,如果非移动端的都直接返回
  if(config.mobile){
    if (config.type === 'uniapp') {
      const pagefile = filePaths[0] + '/pages.json'
      if (fs.existsSync(pagefile)) {
        return filePaths[0]
      } else {
        return 'error'
      }
    } else if (config.type === 'h5') {
      return filePaths[0]
    } else {
      const pagefile = filePaths[0] + '/app.json'
      if (fs.existsSync(pagefile)) {
        return filePaths[0]
      } else {
        return 'error'
      }
    }
  }else{
    return filePaths[0]
  }
})

 
// 设置配置
ipcMain.handle('diygw-set-config', async (event: any, config: any) => {
  dbconfig.set(config.id, config)
  return true
})

// 下载文件
ipcMain.on('diygw-down-file', async (event, {url}) => {
    const win:any = BrowserWindow.getFocusedWindow();
    await download(win, url,{
        saveAs:true
    });
});


// 获取当前源码配置的目录
ipcMain.handle('diygw-save-code', async (event: any, config: any) => {
  const data = <any>dbconfig.get(config.id)
  //判断是否移动端配置,如果非移动端的都直接返回
  if (config.mobile) {
    if (config.code.type === 'uniapp') {
      const projectpath = data[config.code.type] + '/pages/'
      const pagefile = projectpath + config.data.path + '.vue'
      //保存页面代码
      fse.outputFileSync(pagefile, config['code']['htmlValue'])
      //获取页面配置代码
      const pageConfig = data[config.code.type] + '/pages.json'
      const configData = fse.readJSONSync(pageConfig)
      const index = configData.pages.findIndex((item: any) => {
        return item.path === 'pages/' + config.data.path
      })
      if (index >= 0) {
        configData.pages.splice(
          index,
          1,
          JSON.parse(config['code']['jsonValue'])
        )
      } else {
        configData.pages.push(JSON.parse(config['code']['jsonValue']))
      }
      fse.outputFileSync(pageConfig, JSON.stringify(configData, undefined, 4))
    } else if (config.code.type === 'h5') {
      const projectpath = data[config.code.type]
      const pagefile = projectpath + config.data.path + '.html'
      fse.outputFileSync(pagefile, config['code']['htmlValue'])
    } else {
      const projectpath = data[config.code.type] + '/pages/'
      const htmltypes = <any>{
        weixin: 'wxml',
        alipay: 'axml',
        dingtalk: 'axml',
        finclip: 'fxml',
        qq: 'qml',
        baidu: 'swan',
        bytedance: 'ttml'
      }
      const csstypes = <any>{
        weixin: 'wxss',
        alipay: 'acss',
        dingtalk: 'acss',
        finclip: 'ftss',
        qq: 'qss',
        baidu: 'css',
        bytedance: 'ttss'
      }
      const htmlpagefile =
        projectpath + config.data.path + '.' + htmltypes[config.code.type]
      fse.outputFileSync(htmlpagefile, config['code']['htmlValue'])

      const csspagefile =
        projectpath + config.data.path + '.' + csstypes[config.code.type]
      fse.outputFileSync(csspagefile, config['code']['htmlValue'])

      const jspagefile = projectpath + config.data.path + '.js'
      fse.outputFileSync(jspagefile, config['code']['jsValue'])

      const jsonpagefile = projectpath + config.data.path + '.json'
      fse.outputFileSync(jsonpagefile, config['code']['jsonValue'])

      //设置新页面配置代码
      const pageConfig = data[config.code.type] + '/app.json'
      const configData = fse.readJSONSync(pageConfig)
      const index = configData.pages.findIndex((item: any) => {
        return item === 'pages/' + config.data.path
      })
      if (index >= 0) {
        configData.pages.splice(index, 1, 'pages/' + config.data.path)
      } else {
        configData.pages.push('pages/' + config.data.path)
      }
      fse.outputFileSync(pageConfig, JSON.stringify(configData, undefined, 4))
    }
  }
})
