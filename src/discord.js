/**
 * A ligação com o app do Discord (Rich Presence por IPC local).
 *
 * O Discord pode estar fechado quando o jogo abre, ou ser fechado e reaberto
 * no meio: a ligação tenta de novo a cada `RETRY_MS` e reenvia o último status
 * assim que volta. Nada disto trava o jogo — sem Discord, só não há status.
 */
const { Client } = require('@xhayper/discord-rpc')

const RETRY_MS = 15_000
/* O Discord aceita umas 5 atualizações a cada 20 s; uma a cada 4 s fica por
   baixo disso com folga, e o último pedido nunca se perde, só espera. */
const MIN_GAP_MS = 4_000

function createPresence({ clientId, startedAt, gameUrl, inviteUrl, iconUrl }) {
  let client = null
  let ready = false
  let wanted = null
  let lastSentAt = 0
  let pending = null
  let retry = null
  let stopped = false

  function connect() {
    if (stopped || !clientId) return
    client = new Client({ clientId, transport: { type: 'ipc' } })
    client.on('ready', () => {
      ready = true
      flush()
    })
    client.on('disconnected', () => {
      ready = false
      scheduleRetry()
    })
    client.login().catch(() => {
      ready = false
      scheduleRetry()
    })
  }

  function scheduleRetry() {
    if (stopped || retry) return
    retry = setTimeout(() => {
      retry = null
      client?.destroy().catch(() => {})
      client = null
      connect()
    }, RETRY_MS)
  }

  function toActivity(p) {
    const buttons = [{ label: 'Jogar Kagebana', url: gameUrl }]
    if (inviteUrl) buttons.push({ label: 'Servidor do Discord', url: inviteUrl })
    return {
      details: p.details,
      state: p.state,
      startTimestamp: startedAt,
      /* O Discord aceita uma URL no lugar da chave do asset: o ícone do site
         aparece sem subir nada no Portal. (`largeImageUrl` seria o link do
         clique na imagem, não a imagem.) */
      largeImageKey: iconUrl,
      largeImageUrl: gameUrl,
      largeImageText: 'Kagebana',
      smallImageKey: p.classId,
      smallImageText: p.className,
      buttons,
    }
  }

  function flush() {
    if (!ready || !wanted || !client?.user) return
    const wait = lastSentAt + MIN_GAP_MS - Date.now()
    if (wait > 0) {
      if (!pending) pending = setTimeout(() => ((pending = null), flush()), wait)
      return
    }
    lastSentAt = Date.now()
    client.user.setActivity(toActivity(wanted)).catch(() => {})
  }

  connect()

  return {
    set(presence) {
      wanted = presence
      flush()
    },
    async stop() {
      stopped = true
      clearTimeout(retry)
      clearTimeout(pending)
      if (ready) await client?.user?.clearActivity().catch(() => {})
      await client?.destroy().catch(() => {})
    },
  }
}

/**
 * O que chega do jogo passa por aqui antes de ir ao Discord.
 *
 * A página é conteúdo da web; o que ela manda é tratado como dado de fora:
 * só os campos conhecidos, só texto, e no comprimento que o Discord aceita
 * (2 a 128 caracteres — menos que 2 ele recusa a atualização inteira).
 */
function cleanPresence(raw) {
  if (!raw || typeof raw !== 'object') return null
  const text = (v) => {
    if (typeof v !== 'string') return undefined
    const t = v.trim().slice(0, 128)
    return t.length >= 2 ? t : undefined
  }
  const details = text(raw.details)
  if (!details) return null
  const classId = typeof raw.classId === 'string' && /^[a-z0-9_-]{1,32}$/.test(raw.classId) ? raw.classId : undefined
  return { details, state: text(raw.state), classId, className: classId ? text(raw.className) : undefined }
}

module.exports = { createPresence, cleanPresence }
