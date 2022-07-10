const {
    MessageType,
    Mimetype
} = require("@adiwajshing/baileys");

const fs = require("fs");
const {
    cwd
} = require('process')
const axios = require('axios').default
const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);


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
                reply(`*FORMAT SALAH*\n URL Facebook Kosong! \nGunakan Format ${prefix}fbdl url-facebook`);
                return;
            }

            try {
                let urlFb = args[0];

                if (!urlFb.startsWith("http")) {
                    reply(`*FORMAT SALAH*\n Link salah/tidak valid\nGunakan Format ${prefix}fbdl url-facebook`);
                    return;
                }

                let res = await axios.get(urlFb)

                let data = res.data

                let hdLink = scrap(/playable_url_quality_hd":"([^"]+)"/, data)
                let sdLink = scrap(/playable_url":"([^"]+)"/, data)
                let titleFb = scrap(/<title>(.*?)<\/title>/, data)
                let link

                if (hdLink == null) {
                    link = hdLink
                } else if (sdLink == null) {
                    link = sdLink
                } else {
                    reply(`*GAGAL*\Tidak dapat mendapatkan url video`);
                    return
                }

                
                console.log(link)
                
                fs.writeFileSync(cwd() + '/tmp/fb.html', data)
                // let randomName = getRandom(".mp4");

                // const writer = fs.createWriteStream(cwd() + `/tmp/${randomName}`)
                // const stream = await axios({
                //     method: 'get',
                //     url: link,
                //     responseType: 'stream',
                // })
            
                // await new Promise((resolve, reject) => {
                //     stream.data.pipe(writer)
                //     let error = null;
                //     writer.on('error', err => {
                //         error = err;
                //         writer.close();
                //         reject(err);
                //     });
                //     writer.on('close', () => {
                //         if (!error) {
                //             resolve(true);
                //         }
                //     });
                // });

                // let stats = fs.statSync(cwd() + `/tmp/${randomName}`);
                // let fileSizeInBytes = stats.size;
                // // Convert the file size to megabytes (optional)
                // let fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
                // console.log("Video downloaded ! Size: " + fileSizeInMegabytes);
                // if (fileSizeInMegabytes <= 100) {
                //     sock.sendMessage(
                //         from, {
                //             video: fs.readFileSync(cwd() + `/tmp/${randomName}`),
                //             caption: `${titleFb}`,
                //         }, {
                //             quoted: msg
                //         }
                //     );
                // } else {
                //     reply(`*GAGAL*\nUkuran video melebihi 100MB`);
                // }

                // fs.unlinkSync(cwd() + `/tmp/${randomName}`);
            } catch (err) {
                console.log(err);
                // reply(`❌ There is some problem.`);
                reply(err.toString());
            }
        }
    };
};

// const main = async () => {
//     let randomName = getRandom(".mp4");
//     const writer = fs.createWriteStream(cwd() + `/tmp/${randomName}`)
    
    
// }

// main()
