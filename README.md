# Kagebana para desktop

Uma janela do Electron que abre o jogo de `https://kagebana.com` e mostra no
Discord o que você está jogando: fase e dificuldade, Arena e rodada, classe e
nível, tempo de jogo, e botões "Jogar Kagebana" e "Servidor do Discord".

O jogo **não vem dentro do app**: cada deploy do site chega sozinho, e o
instalador só precisa ser gerado de novo quando esta casca muda.

## Como funciona

```
jogo (kagebana.com)                    app (Electron)                   Discord
src/ui/presence.ts  ── a cada 5 s ──▶  preload.js → main.js  ── IPC ──▶  app do Discord
window.kagebanaDesktop.setPresence     cleanPresence + ritmo            (tem de estar aberto)
```

- No navegador `window.kagebanaDesktop` não existe e o jogo não faz nada.
- Discord fechado: o jogo abre normal; o app tenta de novo a cada 15 s.
- O que a página manda é filtrado em `cleanPresence` (só campos conhecidos,
  2–128 caracteres) e só é aceito vindo da origem do jogo.

## Configurar o Discord (uma vez)

1. https://discord.com/developers/applications → **New Application** →
   nome **Kagebana** (é o que aparece em "Jogando …").
2. Copie o **Application ID** para `DISCORD_CLIENT_ID` em `src/config.js`.
3. Opcional: em **Rich Presence → Art Assets**, suba uma imagem por classe
   com o nome igual ao id (`ronin`, `batto`, `okuma`, `yumitori`) — é a
   imagem pequena. A grande já é o ícone do site, sem subir nada.

## Rodar e gerar o instalador

Rode **no Windows** (PowerShell), porque é lá que o Discord está: do WSL o app
não enxerga o Discord.

```
npm install
npm start                 # abre o jogo de produção
npm run start:local       # abre o dev server (http://localhost:5173)
npm run dist              # dist/Kagebana-Setup.exe
```

O instalador sai do GitHub Actions (`.github/workflows/release.yml`) a cada tag `v*`: no Linux o NSIS pede `wine`. `npm run dist` funciona no Windows; o `.exe`
sai sem assinatura, então o Windows mostra o aviso azul na primeira vez:
**Mais informações → Executar assim mesmo**.

`KAGEBANA_URL` e `KAGEBANA_DISCORD_CLIENT_ID` passam por cima do `config.js`.

## Atualização automática

Desde a v0.3.0 o app instalado confere os Releases ao abrir (e de 6 em 6 h),
baixa a versão nova em segundo plano e pergunta se pode reiniciar; senão,
instala ao fechar (`src/update.js`). Publicar é só a tag: o workflow sobe o
`Kagebana-Setup.exe`, o `.blockmap` e o `latest.yml`, que é o que o app
consulta. Sem o `latest.yml` no release, ninguém recebe a versão.

A versão portátil saiu: ela não sabe atualizar-se.

## Tela cheia

F11 ou o botão de cantos no HUD do jogo — os dois mexem na mesma janela, e o
jogo fica sabendo pelo `fullscreen:changed` (v0.4.0). O app abre como foi
fechado, em tela cheia ou não (`window.json` no `userData`).

## Limites conhecidos

- Login com Google é no navegador (o Google bloqueia login dentro de janelas
  de app) e volta ao app por `kagebana://login`; ver `src/main.js`.
- O status só aparece depois do deploy do jogo com `src/ui/presence.ts`. Antes
  disso fica "Samurai contra samurai" e o tempo de jogo.
- Só Windows por enquanto (Mac pediria assinatura da Apple).
