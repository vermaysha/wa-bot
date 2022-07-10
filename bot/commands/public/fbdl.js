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
const puppeteer = require('puppeteer')


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

// module.exports.command = () => {
//     return {
//         cmd: 'fbdl',
//         desc: 'Mendownload video dari facebook',
//         handler: async (sock, msg, from, args, msgInfoObj) => {
//             let {
//                 prefix,
//                 reply
//             } = msgInfoObj;

//             if (args.length === 0) {
//                 reply(`*FORMAT SALAH*\nURL Facebook Kosong! \nGunakan Format ${prefix}fbdl url-facebook`);
//                 return;
//             }

//             try {
//                 let urlFb = new URL(args[0]);

//                 // let res = await axios.head(urlFb, {})

//                 // urlFb = new URL(urlFb)
            
//                 if (!urlFb.hostname.match(/[facebook|fb]\.[com|watch]/i)) {
//                     reply(`*FORMAT SALAH*\nLink salah/tidak valid\nGunakan Format ${prefix}fbdl url-facebook`);
//                     return;
//                 }

//                 urlFb.hostname = 'web.facebook.com'
//                 urlFb.search = ''

//                 // res = await axios.get(urlFb.href)

//                 // let data = res.data

//                 const browser = await puppeteer.launch({
//                     headless: true,
//                     args: ['--no-sandbox','--disable-setuid-sandbox']
//                 });
//                 const page = await browser.newPage();
//                 await page.goto(urlFb.href, {waitUntil: 'domcontentloaded'});
//                 // Wait for 5 seconds
//                 let data = await page.content();
//                 // Take screenshot
//                 await browser.close();

//                 if (scrap(/You must log in to continue/, data)) {
//                     reply(`*GAGAL*\nPastikan video yang akan didownload dapat diakses publik`);
//                     return
//                 }

//                 let hdLink = scrap(/playable_url_quality_hd":"([^"]+)"/, data)
//                 let sdLink = scrap(/playable_url":"([^"]+)"/, data)
//                 let titleFb = scrap(/<title>(.*?)<\/title>/, data)
//                 let link = sdLink ?? hdLink
//                 let randomName = getRandom(".mp4");

//                 if (link == null) {
//                     reply(`*GAGAL*\nTidak dapat mendapatkan url video`);
//                     return
//                 }
                
//                 // console.log(link)

//                 /** Check file size */
//                 res = await axios.head(link)

//                 let fileSizeInBytes = res.headers['content-length'] ?? 0
//                 let fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);

//                 // Limit file size 
//                 if (fileSizeInMegabytes >= 100) {
//                     reply(`*GAGAL*\nUkuran video yang akan didownload melebihi 100MB`);
//                     return
//                 }

//                 const writer = fs.createWriteStream(cwd() + `/tmp/${randomName}`)
//                 const stream = await axios({
//                     method: 'get',
//                     url: link,
//                     responseType: 'stream',
//                 })
            
//                 await new Promise((resolve, reject) => {
//                     stream.data.pipe(writer)
//                     let error = null;
//                     writer.on('error', err => {
//                         error = err;
//                         writer.close();
//                         reject(err);
//                     });
//                     writer.on('close', () => {
//                         if (!error) {
//                             resolve(true);
//                         }
//                     });
//                 });

//                 let stats = fs.statSync(cwd() + `/tmp/${randomName}`);
//                 fileSizeInBytes = stats.size;
//                 // Convert the file size to megabytes (optional)
//                 fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
//                 console.log("Video downloaded ! Size: " + fileSizeInMegabytes);
//                 if (fileSizeInMegabytes <= 100) {
//                     sock.sendMessage(
//                         from, {
//                             video: fs.readFileSync(cwd() + `/tmp/${randomName}`),
//                             caption: `${titleFb}`,
//                         }, {
//                             quoted: msg
//                         }
//                     );
//                 } else {
//                     reply(`*GAGAL*\nUkuran video melebihi 100MB`);
//                 }

//                 fs.unlinkSync(cwd() + `/tmp/${randomName}`);
//             } catch (err) {
//                 // reply(`❌ There is some problem.`);
//                 reply(err.toString());
//             }
//         }
//     };
// };

const main = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://snapsave.app', {
        waitUntil: 'networkidle2'
    });
    // await page.waitForSelector('#url')
    await page.type('#url', 'https://m.facebook.com/groups/ularindonesia/permalink/10158960285494077/?ref=share&_rdc=2&_rdr')
    await page.click('#send')
    await page.waitForSelector('#send')
    // await page.waitForSelector('#download-section .table is-fullwidth')

    // Take screenshot
    await browser.close();
}

main()
