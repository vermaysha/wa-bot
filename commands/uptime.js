const os = require('os')

function format(seconds) {
  seconds = Number(seconds);
  let d = Math.floor(seconds / (3600 * 24));
  let h = Math.floor(seconds % (3600 * 24) / 3600);
  let m = Math.floor(seconds % 3600 / 60);
  let s = Math.floor(seconds % 60);

  let dDisplay = d > 0 ? d + ' hari, ' : "";
  let hDisplay = h > 0 ? h + ' jam, ' : "";
  let mDisplay = m > 0 ? m + ' menit, ' : "";
  let sDisplay = s > 0 ? s + ' detik' : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
}


module.exports.command = () => {
  return {
      cmd: 'uptime',

      desc: 'Menampilkan uptime server ',

      handler: async (sock, msg, from, args, msgInfoObj) => {
          let uptime = format(os.uptime())

          let text = `*SERVER UPTIME*\n\n\n`
          text += `Server telah berjalan selama ${uptime}`
          sock.sendMessage(from, {
              text,
              footer: 'Barbara'
          }, {
              mentions: [from],
              quoted: msg
          });
      }
  };
};
