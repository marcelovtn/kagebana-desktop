/**
 * A única porta entre a página do jogo e o app: uma função, que só manda.
 *
 * O jogo procura `window.kagebanaDesktop` (ver `src/ui/presence.ts` no repo
 * kagebana); no navegador ela não existe e o jogo não faz nada.
 */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('kagebanaDesktop', {
  setPresence: (presence) => ipcRenderer.send('presence:set', presence),
})
