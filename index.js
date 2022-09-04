const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  makeInMemoryStore
} = require('@adiwajshing/baileys')
const sessionDir = 'session'
const fs = require('fs')
const { registerCmd } = require('./helpers/registerCmd')
const { sanitizePhone } = require('./helpers/sanitizePhone')
const prefix = process.env.PREFIX || '.'

const startSock = async () => {
  const { cmd } = await registerCmd()
  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(sessionDir)

  const store = makeInMemoryStore({})

  store.readFromFile('./baileys_store.json')

  // saves the state to a file every 10s
  setInterval(() => {
    store.writeToFile('./baileys_store.json')
  }, 10_000)

  const {
    version,
    isLatest
  } = await fetchLatestBaileysVersion()

  /** */
  const sock = await makeWASocket({
    version: version,
    auth: state,
    printQRInTerminal: true,
    browser: Browsers.ubuntu('Chrome'),
    syncFullHistory: true,
    downloadHistory: true
  })

  // the store can listen from a new socket once the current socket outlives its lifetime
  store.bind(sock.ev)

  /**
   * Handing Whatsapp Event
   */

  /** connection state has been updated -- WS closed, opened, connecting etc. */
  sock.ev.on('connection.update', (update) => {
    const {
      connection,
      lastDisconnect,
      qr,
    } = update

    if (connection === 'close') {
      if (
        (lastDisconnect.error &&
          lastDisconnect.error.output &&
          lastDisconnect.error.output.statusCode) !== DisconnectReason.loggedOut
      ) {
        startSock()
      } else {
        fs.rmSync(sessionDir)
        console.log('Connection closed. You are logged out.')
      }
    } else if (connection === 'open') {
      console.log('Connected')
    }
  })

  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0]
      const content = msg.message
      const from = msg.key.remoteJid

      if (!content || msg.message.protocolMessage != undefined) {
        return //when demote, add, remove, etc happen then msg.message is not there
      }
      await sock.readMessages([msg.key])

      const type = Object.keys(msg.message)[0]

      let body = ''

      switch (type) {
        case 'conversation':
          body = content?.conversation
        break

        case 'imageMessage':
          body = content?.imageMessage.caption
        break

        case 'videoMessage':
          body = content?.videoMessage.caption
        break

        case 'extendedTextMessage':
          body = content?.extendedTextMessage.text
        break

        case 'messageContextInfo':
          body = content?.buttonsResponseMessage?.selectedButtonId
        break
      }

      if (body.startsWith(prefix) == false) {
        await sock.sendPresenceUpdate('available', from)
        return false
      }

      const command = body.slice(1).trim().split(/ +/).shift().toLowerCase()
      const args = body.trim().split(/ +/).slice(1)
      const sender = sanitizePhone(from)
      const senderName = msg.pushName
      
      const isMedia          = (type === "imageMessage" || type === "videoMessage") //image or video
      const isTaggedImage    = (type === "extendedTextMessage" && content?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage != undefined)
      const isTaggedVideo    = (type === "extendedTextMessage" && content?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage != undefined)
      const isTaggedSticker  = (type === "extendedTextMessage" && content?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage != undefined)
      const isTaggedDocument = (type === "extendedTextMessage" && content?.extendedTextMessage?.contextInfo?.quotedMessage?.documentMessage != undefined)

      const reply = (text) => {
        sock.sendMessage(from, { text }, { quoted: m.messages[0] })
      }

      const msgInfoObj = {
        prefix,
        type,
        sender,
        senderName,
        isMedia,
        isTaggedImage,
        isTaggedDocument,
        isTaggedVideo,
        isTaggedSticker,
        reply,
        cmd
      }

      /* ----------------------------- public commands ---------------------------- */
      if (cmd[command]) {
        cmd[command].run(sock, msg, from, args, msgInfoObj)
      } else {
        reply(`Send ${prefix}help for BOT commands!`)
      }

      sock.sendPresenceUpdate('available', from)
    } catch (error) {
      console.log(error)
    }
  })

  /** upsert chats */
  sock.ev.on('creds.update', async () => {
    saveCreds()
  })
}

startSock()
