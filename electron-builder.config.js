/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  appId: "com.diygw.electron",
  productName: "DIY可视化",
  copyright: "Copyright © 2022 diygw",
  // electronDownload: {
  //   mirror: 'https://npm.taobao.org/mirrors/electron/',
  // },
  publish:{
    provider: "github",
    releaseType:'release'
  },
  directories: {
    output: 'dist_electron'
  },
  files: [
    'dist/main/**/*',
    'dist/preload/**/*',
    'dist/renderer/**/*',
  ],
  nsis: {
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "DIYGW可视化",
    perMachine: true,
    oneClick: false
  },
  mac: {
    artifactName: "diygw-macos-${version}.${ext}"
  },
  win: {
    artifactName: "diygw-windows-${version}.${ext}"
  },
  linux: {
    artifactName: "diygw-linux-${version}.${ext}"
  }
}

module.exports = config
