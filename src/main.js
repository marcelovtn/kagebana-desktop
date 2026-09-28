/**
 * Kagebana para desktop: uma janela que abre o jogo, mais o status no Discord.
 *
 * **O jogo não vem dentro do app, vem do site.** Assim cada deploy do jogo
 * chega sozinho, o login é o mesmo do navegador e o instalador só muda quando
 * esta casca muda. `--local` (ou `KAGEBANA_URL`) aponta para o dev server.
 */
const path = require('node:path')
const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { discordClientId, gameUrl, PROD_URL, DISCORD_INVITE } = require('./config')
const { createPresence, cleanPresence } = require('./discord')

const GAME_URL = gameUrl(process.argv)
const GAME_ORIGIN = new URL(GAME_URL).origin
/* A página do jogo chama a API, e o retorno do login pode passar por ela. */
const API_ORIGIN = GAME_ORIGIN === new URL(PROD_URL).origin ? 'https://api.kagebana.com' : 'http://localhost:3002'
const INSIDE = new Set([GAME_ORIGIN, API_ORIGIN])

if (!app.requestSingleInstanceLock()) app.quit()

let win = null
let presence = null

function isInside(url) {
  try {
    return INSIDE.has(new URL(url).origin)
  } catch {
    return false
  }
}

function openOutside(url) {
  if (/^https?:\/\//.test(url)) shell.openExternal(url)
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'Kagebana',
    backgroundColor: '#08090c',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  })
  win.removeMenu()

  /* Link de fora (o convite do Discord, a Wiki) abre no navegador, não aqui. */
  win.webContents.setWindowOpenHandler(({ url }) => {
    openOutside(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (isInside(url)) return
    event.preventDefault()
    openOutside(url)
  })

  /* F11 é tela cheia; sem menu, não há outro jeito de a pedir. */
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen())
      event.preventDefault()
    }
  })

  win.loadURL(GAME_URL)
}

/* Só a página do jogo manda status: um iframe de fora não passa daqui. */
ipcMain.on('presence:set', (event, raw) => {
  if (!presence || !isInside(event.senderFrame?.url ?? '')) return
  const clean = cleanPresence(raw)
  if (clean) presence.set(clean)
})

app.on('second-instance', () => {
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.focus()
})

app.whenReady().then(() => {
  if (discordClientId) {
    presence = createPresence({
      clientId: discordClientId,
      startedAt: Date.now(),
      gameUrl: PROD_URL,
      inviteUrl: DISCORD_INVITE,
      iconUrl: `${PROD_URL}/icons/icon-512.png`,
    })
    /* Até o jogo dizer onde está (e enquanto a versão do site não souber
       dizer), fica o nome do jogo e o tempo a contar. */
    presence.set({ details: 'Samurai contra samurai' })
  } else {
    console.warn('[kagebana] sem DISCORD_CLIENT_ID em src/config.js: o jogo abre, mas sem status no Discord')
  }
  createWindow()
})

app.on('window-all-closed', async () => {
  await presence?.stop()
  app.quit()
})
