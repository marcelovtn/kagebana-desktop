/**
 * **A casca atualiza-se sozinha**, a partir dos Releases do GitHub.
 *
 * O jogo já chegava sozinho (a janela abre o site); o que não chegava era isto:
 * a janela, o status do Discord, o `kagebana://`. A v0.2.0 trouxe o login do
 * Google e ninguém soube que tinha de reinstalar.
 *
 * Abre, confere se há versão nova, baixa em segundo plano e pergunta se pode
 * reiniciar; dizendo que não, instala ao fechar. Confere de novo de seis em
 * seis horas, porque um jogo idle fica aberto dias.
 *
 * Só no app instalado: `npm start` não tem `app-update.yml` e a versão portátil
 * não sabe instalar nada por cima de si.
 */
const { app, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')

const EVERY_MS = 6 * 60 * 60 * 1000

function watchUpdates(getWindow) {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  let asked = false
  autoUpdater.on('update-downloaded', async (info) => {
    if (asked) return
    asked = true
    const win = getWindow()
    const options = {
      type: 'info',
      title: 'Kagebana',
      message: `A versão ${info.version} do app está pronta.`,
      detail: 'Reinicie agora para usar, ou ela entra sozinha da próxima vez que você fechar o app.',
      buttons: ['Reiniciar agora', 'Depois'],
      defaultId: 0,
      cancelId: 1,
    }
    const { response } = win ? await dialog.showMessageBox(win, options) : await dialog.showMessageBox(options)
    if (response === 0) autoUpdater.quitAndInstall()
  })

  /* Sem rede, GitHub fora do ar, release a meio de publicar: nada disto pode
     parar o jogo. Tenta-se outra vez na volta seguinte. */
  autoUpdater.on('error', (error) => console.warn('[kagebana] atualização:', error?.message ?? error))

  const check = () => autoUpdater.checkForUpdates().catch(() => {})
  check()
  setInterval(check, EVERY_MS)
}

module.exports = { watchUpdates }
