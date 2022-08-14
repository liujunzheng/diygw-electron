window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector:string, text?:string) => {
        const element = document.getElementById(selector)
        if (element && text) element.innerText = text
    }

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }
})

import { contextBridge, ipcRenderer } from 'electron'
contextBridge.exposeInMainWorld('electron', { ipcRenderer })

// contextBridge.exposeInMainWorld('ipcRenderer', {
//     send: <T>(channel:string, data:T)=> {
//         ipcRenderer.send(channel, data)
//     },
//     receive: (channel:string)=> {
//         return new Promise((resolve,reject)=>{
//             ipcRenderer.on(channel,(event,data)=>{
//                 resolve(data)
//             })
//         })
//     }
// })