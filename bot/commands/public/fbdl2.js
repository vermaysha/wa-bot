const {
    MessageType,
    Mimetype
} = require("@adiwajshing/baileys");

const fs = require("fs");
const {
    cwd
} = require('process')
const axios = require('axios').default
const puppeteer = require('puppeteer')
const {
    decode
} = require('html-entities')



const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

scrap = (regex, data) => {
    let match = data.match(regex)

    if (match != null) {
        return decode(match[1])
    }
    return null
}

module.exports.command = () => {
    return {
        cmd: 'fbdl2',
        desc: 'Mendownload video dari facebook (beta)',
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

                if (!urlFb.match(/^http(s)?:\/\/((www|web|m)?.)?(fb|facebook)\.(watch|com)/i)) {
                    reply(`*GAGAL*\nHarapgunakan alamat dari facebook`);
                    return
                }

                const browser = await puppeteer.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                })
                const page = await browser.newPage()
        
                await page.goto('https://snapsave.app/', {
                    waitUntil: ['networkidle2']
                })
                await page.type('input#url', urlFb)
                await Promise.all([
                    page.click('button#send'),
                ]);

                sock.sendPresenceUpdate('composing', from)
                await page.waitForSelector('table tbody tr', {
                    visible: true
                })
                sock.sendPresenceUpdate('composing', from)
                const data = await page.$$eval('table tbody tr', rows => {
                    return Array.from(rows, row => {
                        const columns = row.querySelectorAll('td');
                        return Array.from(columns, column => column.innerHTML);
                    });
                });
        
                await browser.close()

                let links = {}
                
                for (let key in data) {
                    let k = data[key][0].replace(/\D/g, '')
                    if (k != '') {
                        let match = data[key][2].match(/href="([^"]+)"/)
                        if (match != null)
                        links[k] = decode(match[1])
                    }
                }
                
                let link = (links['720'] ?? links['360']) ?? null

                let randomName = getRandom(".mp4");

                if (link == null) {
                    reply(`*GAGAL*\nTidak dapat mendapatkan url video`);
                    return
                }
                
                /** Check file size */
                sock.sendPresenceUpdate('composing', from)
                res = await axios.head(link)
                let fileSizeInBytes = res.headers['content-length'] ?? 0
                let fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);

                // Limit file size 
                if (fileSizeInMegabytes >= 100) {
                    reply(`*GAGAL*\nUkuran video yang akan didownload melebihi 100MB`);
                    return
                }

                const writer = fs.createWriteStream(cwd() + `/tmp/${randomName}`)
                sock.sendPresenceUpdate('composing', from)
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
                sock.sendPresenceUpdate('composing', from)
                if (fileSizeInMegabytes <= 100) {
                    sock.sendMessage(
                        from, {
                            video: fs.readFileSync(cwd() + `/tmp/${randomName}`)
                        }, {
                            quoted: msg
                        }
                    );
                } else {
                    reply(`*GAGAL*\nUkuran video melebihi 100MB`);
                }

                fs.unlinkSync(cwd() + `/tmp/${randomName}`);
            } catch (err) {
                reply(`*GAGAL*\nPastikan video yang akan didownload bersifat publik`);
                return
            }
        }
    };
};

