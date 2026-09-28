/**
 * O que muda de um Kagebana para outro fica aqui.
 *
 * `DISCORD_CLIENT_ID` é o "Application ID" do app criado no Discord Developer
 * Portal (https://discord.com/developers/applications). O nome desse app é o
 * que aparece em "Jogando …". Vazio, o jogo abre normal e só não há status.
 * A variável de ambiente `KAGEBANA_DISCORD_CLIENT_ID` passa por cima.
 */
const DISCORD_CLIENT_ID = '1553937228168691722'

const PROD_URL = 'https://kagebana.com'
/* O dev server do jogo (`npm run dev` no repo kagebana). */
const LOCAL_URL = 'http://localhost:5173'

const DISCORD_INVITE = 'https://discord.gg/2zN4GY6wgj'

function gameUrl(argv) {
  if (process.env.KAGEBANA_URL) return process.env.KAGEBANA_URL
  return argv.includes('--local') ? LOCAL_URL : PROD_URL
}

module.exports = {
  discordClientId: process.env.KAGEBANA_DISCORD_CLIENT_ID || DISCORD_CLIENT_ID,
  gameUrl,
  PROD_URL,
  DISCORD_INVITE,
}
