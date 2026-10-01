/**
 * A única porta entre a página do jogo e o app: uma função, que só manda.
 *
 * O jogo procura `window.kagebanaDesktop` (ver `src/ui/presence.ts` no repo
 * kagebana); no navegador ela não existe e o jogo não faz nada.
 */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('kagebanaDesktop', {
  setPresence: (presence) => ipcRenderer.send('presence:set', presence),
  /* v0.2.0 — o login do Google no navegador; ver `login` em main.js. */
  signInWithGoogle: () => ipcRenderer.send('login:google'),
  /* Quem escuta avisa que está pronto: o jogo só se inscreve depois do
     arranque, e um código mandado antes disso perdia-se. */
  onLogin: (listener) => {
    ipcRenderer.on('login:token', (_event, token) => listener(token))
    ipcRenderer.send('login:ready')
  },
  /* v0.4.0 — a tela cheia da janela, a mesma do F11; ver `tellFullScreen`. */
  setFullScreen: (on) => ipcRenderer.send('fullscreen:set', on === true),
  onFullScreen: (listener) => {
    ipcRenderer.on('fullscreen:changed', (_event, on) => listener(on === true))
    ipcRenderer.send('fullscreen:ready')
  },
})
