const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    Browsers
} = require('@adiwajshing/baileys');
const {
    logger,
    getGroupAdmins,
    parseSession,
    sanitizePhone,
    unknownCmd,
    registerCmd
} = require('../helpers')
const fs = require('fs-extra')
const sessionDir = 'tmp/session'
const {
    models
} = require('../database')
require('dotenv').config()
const process = require('process');
const prefix = process.env.PREFIX ?? '.'
const myNumber = process.env.MY_NUMBER ?? null

/** Remove session directory */
fs.removeSync(sessionDir)

const startSock = async () => {
    // registerCmd()
    // return
    const { cmdPublic, cmdGroupMember, cmdGroupAdmin, cmdOwner } = await registerCmd()

    let session = parseSession((await models.session.findOne())?.session)

    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(sessionDir)

    const {
        version,
        isLatest
    } = await fetchLatestBaileysVersion();

    if (session) {
        state.creds = session.creds
    }

    /** */
    const sock = await makeWASocket({
        version: version,
        auth: state,
        logger: logger,
        printQRInTerminal: true,
        browser: Browsers.ubuntu('Chrome')
    })

    /**
     * Handing Whatsapp Event
     */

    /** connection state has been updated -- WS closed, opened, connecting etc. */
    sock.ev.on('connection.update', (update) => {
        const {
            connection,
            lastDisconnect,
            qr,
        } = update;
        if (connection === 'close') {
            if (
                (lastDisconnect.error &&
                    lastDisconnect.error.output &&
                    lastDisconnect.error.output.statusCode) !== DisconnectReason.loggedOut
            ) {
                startSock();
            } else {
                fs.removeSync(sessionDir)
                models.session.destroy({
                    where: {},
                    truncate: true
                })
                console.log('Connection closed. You are logged out.');
            }
        } else if (connection === 'open') {
            console.log('Connected');
        }
    })

    /** upsert chats */
    sock.ev.on('creds.update', async () => {
        saveCreds()
        let values = {
            session: state
        }
        await models.session.findOne({}).then((obj) => {
            if (obj)
                return obj.update(values)
            return models.session.create(values)
        })
    });

    /**
     * add/update the given messages. If they were received while the connection was online,
     * the update will have type: "notify"
     */
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            const content = msg.message;            
            const from = msg.key.remoteJid;
            
            if (!msg.message || msg.message.protocolMessage != undefined)  {
                return; //when demote, add, remove, etc happen then msg.message is not there
            }

            await sock.readMessages([msg.key])
            sock.sendPresenceUpdate('composing', from)
   
            const type = Object.keys(msg.message)[0];

            let botNumberJid = sanitizePhone(sock.user.id);
            
            let body;
            if (type === "conversation" && msg.message.conversation.startsWith(prefix)) {
                body = msg.message.conversation
            } else if (type == "imageMessage" && msg.message.imageMessage.caption?.startsWith(prefix)) {
                body = msg.message.imageMessage.caption
            } else if (type == "videoMessage" && msg.message.videoMessage.caption?.startsWith(prefix)) {
                body = msg.message.videoMessage.caption
            } else if (type == "extendedTextMessage" && msg.message.extendedTextMessage.text?.startsWith(prefix)) {
                body = msg.message.extendedTextMessage.text                
            } else if (type == "messageContextInfo") {
                body = msg.message?.buttonsResponseMessage?.selectedButtonId
            } else  {
                body = '' // Unknown command
            }

            
            // if (body[1] == " ") body = body[0] + body.slice(2); //remove space when space btw prefix and commandName like "! help"
            
            const command = body.slice(1).trim().split(/ +/).shift().toLowerCase();
            const args = body.trim().split(/ +/).slice(1);
            const isCmd = body.startsWith(prefix);
            
            const isGroup = from.endsWith("@g.us");
            const groupMetadata = isGroup ? await sock.groupMetadata(from) : "";
            const groupName = isGroup ? groupMetadata.subject : "";
            let sender = sanitizePhone(isGroup ? msg.key.participant : from);
            
            // console.log(body, command, isCmd)
            if (msg.key.fromMe) {
                sender = botNumberJid;
            }

            const senderName = msg.pushName;
        
            if (!isCmd) {
                sock.sendPresenceUpdate('paused', from)
                return;
            }
      
            const groupDesc = isGroup ? groupMetadata.desc.toString() : "";
            const groupMembers = isGroup ? groupMetadata.participants : [];
            const groupAdmins = isGroup ? getGroupAdmins(groupMembers) : [];
            const isBotGroupAdmins = groupAdmins.includes(botNumberJid) || false;
            const isGroupAdmins = groupAdmins.includes(sender) || false;

            
            const isMedia          = (type === "imageMessage" || type === "videoMessage"); //image or video
            const isTaggedImage    = (type === "extendedTextMessage" && content.imageMessage != undefined);
            const isTaggedVideo    = (type === "extendedTextMessage" && content.videoMessage != undefined);
            const isTaggedSticker  = (type === "extendedTextMessage" && content.stickerMessage != undefined);
            const isTaggedDocument = (type === "extendedTextMessage" && content.documentMessage != undefined);
      
            const reply = (text) => {
              sock.sendMessage(from, { text }, { quoted: m.messages[0] });
            };
      
            let msgInfoObj = {
              prefix,
              sender,
              senderName,
              groupName,
              groupDesc,
              groupMembers,
              groupAdmins,
              isBotGroupAdmins,
              isGroupAdmins,
              isMedia,
              type,
              isTaggedImage,
              isTaggedDocument,
              isTaggedVideo,
              isTaggedSticker,
              botNumberJid,
              myNumber,
              reply,
              cmdPublic, cmdGroupMember, cmdGroupAdmin, cmdOwner
            };

            /* ----------------------------- public commands ---------------------------- */
            if (cmdPublic[command]) {
                cmdPublic[command].run(sock, msg, from, args, msgInfoObj);
            } else {
                unknownCmd(sock, msg, from, prefix)
            }

            // await sock.sendPresenceUpdate('available', msg)

            sock.sendPresenceUpdate('available', from)

          } catch (err) {
            console.error(err)
            return;
          }
    });

    /** message was reacted to. If reaction was removed -- then "reaction.text" will be falsey */
    sock.ev.on('messages.reaction', async (m) => {
    });

    /** Receive an update on a call, including when the call was received, rejected, accepted */
    sock.ev.on('call', async (m) => {
    });

    /** apply an action to participants in a group */
    sock.ev.on('group-participants.update', async (m) => {
    });

    return sock;
};

exports.bot = startSock
