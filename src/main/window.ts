import { app, BrowserWindow, screen } from "electron";
import { MainMenu } from './menu'
import { info } from './utils'
import path from 'path'

const isDev = !app.isPackaged

/**
 * 创建主窗口
 */
export async function createWindow() {
  //顶部菜单
  const mainMenu = new MainMenu([
    {
      label: '刷新',
      role: 'forceReload',
      accelerator: 'F5'
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
  mainMenu.createMainMenu()

  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  const preloadPath = path.join(__dirname, '../preload/index.js')
  const mainWin = new BrowserWindow({
    width: width,
    height: height,
    show: false,
    webPreferences: {
      webSecurity: false, //解决跨域
      preload: preloadPath
    }
  })

  // const URL = isDev
  //   ? process.env.DS_RENDERER_URL
  //   : `file://${path.join(app.getAppPath(), 'dist/renderer/index.html')}`

  const URL = isDev ? 'http://localhost:9091': 'https://www.diygw.com'

  mainWin.loadURL(URL)

  mainWin.once('ready-to-show', () => {
    mainWin && mainWin.show()
    mainWin?.maximize()
  })

  mainWin.webContents.setWindowOpenHandler(data => {
    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        width: width,
        height: height,
        webPreferences: {
          webSecurity: false, //解决跨域
          preload: preloadPath
        }
      }
    };
  })

  return mainWin
}