import { app, BrowserWindow, Menu, shell, nativeImage } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { registerIpcHandlers } from '../ipc/handlers'
import { clearSession } from '../stores/session-store'
import { appLog, initAppLogger } from '../services/app-logger'

const APP_TITLE = 'AIDLC inception view'

function resolveAppIcon(): Electron.NativeImage | undefined {
  const candidates = [
    join(process.cwd(), 'build', 'icon.png'),
    join(__dirname, '../../build/icon.png'),
    join(__dirname, '../../../build/icon.png')
  ]
  for (const p of candidates) {
    if (!existsSync(p)) continue
    const img = nativeImage.createFromPath(p)
    if (!img.isEmpty()) return img
  }
  return undefined
}

function createWindow(): void {
  const icon = resolveAppIcon()
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    show: false,
    title: APP_TITLE,
    autoHideMenuBar: true,
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.on('ready-to-show', () => win.show())
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  initAppLogger()
  app.setName(APP_TITLE)
  Menu.setApplicationMenu(null)
  registerIpcHandlers()
  createWindow()
  appLog('info', 'Application ready')
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  appLog('info', 'All windows closed; clearing session')
  clearSession()
  if (process.platform !== 'darwin') app.quit()
})
