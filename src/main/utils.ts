import path from 'path'
import { dialog } from 'electron'
import { type, arch, release } from 'os'

// 解决系统托盘图标打包后不显示的问题
export class PathUtils {
  // 将startPath作为标准路径，静态资源的路径和项目中使用到的路径全部由startPath起始
  public static startPath = path.join(__dirname, '..');

  public static resolvePath = (dirPath: string) => {
    return path.join(PathUtils.startPath, dirPath || '.');
  };
}


export function reloadPage(win: any) {
  const options = {
    type: 'question',
    buttons: ['重新加载', '取消'],
    defaultId: 1,
    cancelId: 0,
    title: '重新加载',
    message: '系统可能不会保存您所做的更改,请先保存'
  }

  const choice = dialog.showMessageBoxSync(win, options)
  const isReload = choice === 0

  if (isReload) {
    win.webContents.reload()
  }
}

export function info() {
  dialog.showMessageBox({
    title: '关于我们',
    type: 'info',
    message: 'DIY官网可视化工具',
    detail: `网站地址:https://www.diygw.com\nDIY官网可视化工具做好的可视化拖拽开发工具\n无须编程 零代码基础 所见即所得设计工具\n轻松制作微信小程序、支付宝小程序、Vue3、H5、WebApp、UNIAPP、单页动画\n版本信息：${process.env.VUE_APP_VERSION
      }\n引擎版本：${process.versions.v8
      }\n当前系统：${type()} ${arch()} ${release()}`,
    noLink: true,
    buttons: ['确定']
  })
}