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

                let res = await axios.get(urlFb, {
                    headers: {
                        'sec-fetch-user': '?1',
                        'sec-ch-ua-mobile': '?0',
                        'sec-fetch-site': 'none',
                        'sec-fetch-dest': 'document',
                        'sec-fetch-mode': 'navigate',
                        'cache-control': 'max-age=0',
                        'authority': 'www.facebook.com',
                        'upgrade-insecure-requests': '1',
                        'accept-language': 'en-GB,en;q=0.9,tr-TR;q=0.8,tr;q=0.7,en-US;q=0.6',
                        'sec-ch-ua': '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
                        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                        'cookie': 'sb=Rn8BYQvCEb2fpMQZjsd6L382; datr=Rn8BYbyhXgw9RlOvmsosmVNT; c_user=100003164630629; _fbp=fb.1.1629876126997.444699739; wd=1920x939; spin=r.1004812505_b.trunk_t.1638730393_s.1_v.2_; xs=28%3A8ROnP0aeVF8XcQ%3A2%3A1627488145%3A-1%3A4916%3A%3AAcWIuSjPy2mlTPuZAeA2wWzHzEDuumXI89jH8a_QIV8; fr=0jQw7hcrFdas2ZeyT.AWVpRNl_4noCEs_hb8kaZahs-jA.BhrQqa.3E.AAA.0.0.BhrQqa.AWUu879ZtCw',
                    }
                })

                let data = res.data

                let hdLink = scrap(/playable_url_quality_hd":"([^"]+)"/, data)
                let sdLink = scrap(/playable_url":"([^"]+)"/, data)
                let titleFb = scrap(/<title>(.*?)<\/title>/, data)

                let randomName = getRandom(".mp4");

                const writer = fs.createWriteStream(cwd() + `/tmp/${randomName}`)
                const stream = await axios({
                    method: 'get',
                    url: hdLink ?? sdLink,
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
                let fileSizeInBytes = stats.size;
                // Convert the file size to megabytes (optional)
                let fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
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
