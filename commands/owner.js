const {
  cwd
} = require('process')

const fs = require('fs')

module.exports.command = () => {
  return {
    cmd: 'owner',

    desc: 'Menampilkan informasi pemilik bot',

    handler: async (sock, msg, from, args, msgInfoObj) => {
      let {
        prefix,
        cmd,
        senderName
      } = msgInfoObj;

      let text = `Berikut kontak dari pemilik bot ini.`;

      //send a template message!
      const templateButtons = [{
          index: 1,
          urlButton: {
            displayText: 'Github !',
            url: 'https://github.com/vermaysha'
          }
        },
        {
          index: 2,
          callButton: {
            displayText: 'Call me!',
            phoneNumber: '+62895346266988'
          }
        }
      ]

      const templateMessage = {
        text: text,
        footer: 'Barbara',
        templateButtons: templateButtons
      }
      
      sock.sendMessage(from, templateMessage, {
        mentions: [from]
      });
    }
  };
};
