const { cwd } = require('process')
const fs = require('fs')
const { pipeline } = require('stream')
const { promisify } = require('util')
const fetch = require('node-fetch')
const fbDownloader = require("fb-downloader-scrapper")
const streamPipeline = promisify(pipeline);

const getRandom = (ext) => {
  return `${Math.floor(Math.random() * 10000)}${ext}`;
};

scrap = (regex, data) => {
  let match = data.match(regex)

  if (match != null) {
    return JSON.parse(`{"data": "${match[1]}"}`).data
  }
  return null
}

module.exports.command = () => {
  return {
    cmd: 'fbdl',
    desc: 'Mendownload video dari facebook',
    handler: async (sock, msg, from, args, msgInfoObj) => {
      let {
        prefix,
        reply
      } = msgInfoObj;

      if (args.length === 0) {
        reply(`*FORMAT SALAH*\nURL Facebook Kosong! \nGunakan Format ${prefix}fbdl url-facebook`);
        return;
      }

      try {
        let urlFb = args[0];
        if (!urlFb.startsWith("http")) {
          reply(`*FORMAT SALAH*\n Link salah/tidak valid\nGunakan Format ${prefix}fbdl url-youtube`);
          return;
        }

        const infoFb = await fbDownloader(urlFb)

        if ( ! infoFb.success) {
          reply(`*Video private !*\n Maaf tidak bisa mendownload video ini`)
        }

        if (infoFb.video_length >= 1800) {
          reply(`*GAGAL*\nDurasi video melebihi 30 Menit`);
          return;
        }

        let randomName = getRandom(".mp4");
        const response = await fetch(infoFb.download[0].url);

        await streamPipeline(response.body, fs.createWriteStream(cwd() + `/tmp/${randomName}`));
        sock.sendMessage(
          from, {
              video: fs.readFileSync(cwd() + `/tmp/${randomName}`),
          }, {
              quoted: msg
          }
        );
        fs.unlinkSync(cwd() + `/tmp/${randomName}`);
      } catch (err) {
        console.log(err);
        // reply(`❌ There is some problem.`);
        reply(err.toString());
      }
    }
  };
};
