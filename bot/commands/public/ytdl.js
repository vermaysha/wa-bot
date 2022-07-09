const {
    MessageType,
    Mimetype
} = require("@adiwajshing/baileys");

const ytdl = require("ytdl-core");
const fs = require("fs");
const { cwd } = require('process')

const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

module.exports.command = () => {
    return {
        cmd: 'ytdl',
        desc: 'Mendownload video dari youtube',
        handler: async (sock, msg, from, args, msgInfoObj) => {
            let {
                prefix,
                reply
            } = msgInfoObj;
            if (args.length === 0) {
                reply(`*FORMAT SALAH*\n URL Youtube Kosong! \nGunakan Format ${prefix}ytdl url-youtube`);
                return;
            }
            try {
                let urlYt = args[0];
                if (!urlYt.startsWith("http")) {
                    reply(`*FORMAT SALAH*\n Link salah/tidak valid\nGunakan Format ${prefix}ytdl url-youtube`);
                    return;
                }
                let infoYt = await ytdl.getInfo(urlYt);
                //30 MIN
                if (infoYt.videoDetails.lengthSeconds >= 1800) {
                    reply(`*GAGAL*\nDurasi video melebihi 30 Menit`);
                    return;
                }
                let titleYt = infoYt.videoDetails.title;
                let randomName = getRandom(".mp4");
        
                const stream = ytdl(urlYt, {
                    filter: (info) => info.itag == 22 || info.itag == 18,
                }).pipe(fs.createWriteStream(cwd() + `/tmp/${randomName}`));
                //22 - 1080p/720p and 18 - 360p
                console.log("Video downloading ->", urlYt);
                // reply("Downloading.. This may take upto 5 min!");
                await new Promise((resolve, reject) => {
                    stream.on("error", reject);
                    stream.on("finish", resolve);
                });
        
                let stats = fs.statSync(cwd() + `/tmp/${randomName}`);
                let fileSizeInBytes = stats.size;
                // Convert the file size to megabytes (optional)
                let fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
                console.log("Video downloaded ! Size: " + fileSizeInMegabytes);
                if (fileSizeInMegabytes <= 100) {
                    sock.sendMessage(
                        from, {
                            video: fs.readFileSync(cwd() + `/tmp/${randomName}`),
                            caption: `${titleYt}`,
                        }, {
                            quoted: msg
                        }
                    );
                } else {
                    reply(`*GAGAL*\nUkuran video melebihi 100MB`);
                }
        
                fs.unlinkSync(cwd() + `/tmp/${randomName}`);
            } catch (err) {
                console.log(err);
                // reply(`❌ There is some problem.`);
                reply(err.toString());
            }
        }
    };
};
