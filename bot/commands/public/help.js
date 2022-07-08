const {
    MessageType,
    Mimetype
} = require("@adiwajshing/baileys");
const {
    cwd
} = require('process')
const fs = require('fs')

module.exports.command = () => {
    return {
        cmd: 'help',

        desc: 'Menampilkan informasi tentang beberapa perintah atau seluruh perintah untuk Bot',

        handler: async (sock, msg, from, args, msgInfoObj) => {
            let {
                isGroup,
                isGroupAdmin,
                myNumber,
                prefix,
                cmdPublic,
                cmdGroupMember,
                cmdGroupAdmin,
                cmdOwner, senderName
            } = msgInfoObj;

            let text = `Halo ${senderName}, Berikut perintah yang dapat kamu gunakan: \n\n\n`;

            let bullet = String.fromCharCode(8226)

            for (const key in cmdPublic) {
                text += `*${bullet})  ${prefix + key}*  ─  ${cmdPublic[key].desc}\n`
            }

            const buttons = [{
                    buttonId: '.owner',
                    buttonText: {
                        displayText: 'Owner'
                    },
                    type: 1
                }
            ]

            const buttonMessage = {
                image: fs.readFileSync(cwd() + '/assets/Barbara.jpg'),
                caption: text,
                footer: 'Barbara',
                buttons: buttons,
                headerType: 4,
            }


            sock.sendMessage(from, buttonMessage, {
                mentions: [from]
            });
        }
    };
};
