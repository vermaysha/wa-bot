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
const { response } = require("express");
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
                reply(`*FORMAT SALAH*\nURL Facebook Kosong! \nGunakan Format ${prefix}fbdl url-facebook`);
                return;
            }

            try {
                let urlFb = args[0];

                let res = await axios.head(urlFb)

                urlFb = new URL(res.request.res.responseUrl)
            
                if (!urlFb.hostname.match(/facebook\.com/i)) {
                    reply(`*FORMAT SALAH*\nLink salah/tidak valid\nGunakan Format ${prefix}fbdl url-facebook`);
                    return;
                }

                urlFb.hostname = 'web.facebook.com'
                urlFb.search = ''

                res = await axios.get(urlFb.href, {
                    headers: {
                        'sec-fetch-user'            : '?1',
                        'sec-ch-ua-mobile'          : '?0',
                        'sec-fetch-site'            : 'none',
                        'sec-fetch-dest'            : 'document',
                        'sec-fetch-mode'            : 'navigate',
                        'cache-control'             : 'max-age=0',
                        'authority'                 : 'www.facebook.com',
                        'upgrade-insecure-requests' : '1',
                        'accept-language'           : 'en-GB,en;q=0.9,tr-TR;q=0.8,tr;q=0.7,en-US;q=0.6',
                        'sec-ch-ua'                 : '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
                        'user-agent'                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
                        'accept'                    : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                    }
                })

                let data = res.data

                if (scrap(/You must log in to continue/, data)) {
                    reply(`*GAGAL*\nPastikan video yang akan didownload dapat diakses publik`);
                    return
                }

                let hdLink = scrap(/playable_url_quality_hd":"([^"]+)"/, data)
                let sdLink = scrap(/playable_url":"([^"]+)"/, data)
                let titleFb = scrap(/<title>(.*?)<\/title>/, data)
                let link = sdLink ?? hdLink
                let randomName = getRandom(".mp4");

                if (link == null) {
                    reply(`*GAGAL*\nTidak dapat mendapatkan url video`);
                    return
                }
                
                // console.log(link)

                /** Check file size */
                res = await axios.head(link)

                let fileSizeInBytes = res.headers['content-length'] ?? 0
                let fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);

                // Limit file size 
                if (fileSizeInMegabytes >= 100) {
                    reply(`*GAGAL*\nUkuran video yang akan didownload melebihi 100MB`);
                    return
                }

                const writer = fs.createWriteStream(cwd() + `/tmp/${randomName}`)
                const stream = await axios({
                    method: 'get',
                    url: link,
                    responseType: 'stream',
                })
            
                await new Promise((resolve, reject) => {
                    stream.data.pipe(writer)
                    let error = null;
                    writer.on('error', err => {
                        error = err;
                        writer.close();
                        reject(err);
                    });
                    writer.on('close', () => {
                        if (!error) {
                            resolve(true);
                        }
                    });
                });

                let stats = fs.statSync(cwd() + `/tmp/${randomName}`);
                fileSizeInBytes = stats.size;
                // Convert the file size to megabytes (optional)
                fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
                console.log("Video downloaded ! Size: " + fileSizeInMegabytes);
                if (fileSizeInMegabytes <= 100) {
                    sock.sendMessage(
                        from, {
                            video: fs.readFileSync(cwd() + `/tmp/${randomName}`),
                            caption: `${titleFb}`,
                        }, {
                            quoted: msg
                        }
                    );
                } else {
                    reply(`*GAGAL*\nUkuran video melebihi 100MB`);
                }

                fs.unlinkSync(cwd() + `/tmp/${randomName}`);
            } catch (err) {
                // reply(`❌ There is some problem.`);
                reply(err.toString());
            }
        }
    };
};

// const main = async () => {

// }

// main()
