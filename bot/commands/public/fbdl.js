const {
    MessageType,
    Mimetype
} = require("@adiwajshing/baileys");

const fs = require("fs");
const {
    cwd
} = require('process')
const axios = require('axios').default


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
                let urlFb = new URL(args[0]);
                let axisConfig = {
                    headers: {
                        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                        'accept-language': 'en-US,en;q=0.9',
                        'cache-control': 'max-age=0',
                        'sec-ch-ua': ' Not;A Brand";v="99", "Microsoft Edge";v="103", "Chromium";v="103',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': 'Windows',
                        'sec-fetch-dest': 'document',
                        'sec-fetch-mode': 'navigate',
                        'sec-fetch-site': 'same-origin',
                        'sec-fetch-user': '?1',
                        'upgrade-insecure-requests': '1',
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.114 Safari/537.36 Edg/103.0.1264.49',
                        'cookie': 'sb=XYLLYuuk-3xPMr6HnPAD5eiQ; fr=0sgS7cfVDztC7jZAv..Biy4Jd.Yw.AAA.0.0.Biy4Jd.AWUH8-60rps; wd=1920x541; datr=XYLLYiderKRIZpi2Kq-V2T-c'
                    },
                    withCredentials: true
                }

                // console.log(urlFb.href)

                // let res = await axios.head(urlFb.href, axisConfig)
                            
                // if (!urlFb.hostname.match(/[facebook|fb]\.[com|watch]/i)) {
                //     reply(`*FORMAT SALAH*\nLink salah/tidak valid\nGunakan Format ${prefix}fbdl url-facebook`);
                //     return;
                // }

                // console.log(urlFb.href)

                // urlFb.hostname = 'web.facebook.com'
                
                console.log(urlFb.href)

                res = await axios.get(urlFb.href, axisConfig)

                let data = res.data

                console.log(res.request.res.responseUrl)

                fs.writeFileSync(cwd() + '/tmp/facebook.html', data)

                if (scrap(/You must log in to continue/, data)) {
                    reply(`*GAGAL*\nPastikan video yang akan didownload dapat diakses publik`);
                    return
                }

                let hdLink = scrap(/playable_url_quality_hd":"([^"]+)"/, data)
                let sdLink = scrap(/playable_url":"([^"]+)"/, data)
                let titleFb = scrap(/<title>(.*?)<\/title>/, data)
                let link = sdLink ?? hdLink
                let randomName = getRandom(".mp4");

                console.log(hdLink, sdLink, titleFb)

                if (link == null) {
                    reply(`*GAGAL*\nTidak dapat mendapatkan url video`);
                    return
                }
                
                // console.log(link)

                /** Check file size */
                res = await axios.head(link, axisConfig)

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
//     const browser = await puppeteer.launch({
//         headless: true,
//         args: ['--no-sandbox','--disable-setuid-sandbox']
//     });
//     const page = await browser.newPage();
//     await page.goto('https://snapsave.app', {
//         waitUntil: 'networkidle2'
//     });
//     // await page.waitForSelector('#url')
//     await page.type('#url', 'https://m.facebook.com/groups/ularindonesia/permalink/10158960285494077/?ref=share&_rdc=2&_rdr')
//     await page.click('#send')
//     // await page.waitForSelector('#download-section .table is-fullwidth')
//     // await page.waitForNavigation({ waitUntil: "networkidle0" })
//     let isLoadingAvailable = true // Your condition-to-stop

//     await page.waitForNavigation({ waitUntil: 'networkidle0' });

//     // while (isLoadingAvailable) {
//     //     try{
//             // await page.waitForResponse( response => response.status() === 200 )
//     //     } catch (ex) {
//     //         continue;
            
//     //     }
//     //     isLoadingAvailable = false // Update your condition-to-stop value
//     // }
//     // await page.waitFor
//     // await page.focus('#download-section')
//     // const data = await page.evaluate(() => {
//     //     // let data = [];
//     //     let table = document.getElementsByClassName('table');

//     //     return table
  
//     //     // for (var i = 1; i < table.rows.length; i++) {
//     //     //   let objCells = table.rows.item(i).cells;
  
//     //     //   let values = [];
//     //     //   for (var j = 0; j < objCells.length; j++) {
//     //     //     let text = objCells.item(j).innerHTML;
//     //     //     values.push(text);
//     //     //   }
//     //     //   let d = { i, values };
//     //     //   data.push(d);
//     //     // }
  
//     //     // return data;
//     // });
//     await page.screenshot({
//         path: cwd() + '/tmp/ss.png'
//     })
//     // Take screenshot
//     await browser.close();

//     // console.log(data)
// }

// main()
