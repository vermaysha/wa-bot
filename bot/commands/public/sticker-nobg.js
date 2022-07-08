// convert FB_IMG_1657011627350.jpg -fuzz 2% -fill none -draw "matte 0,0 floodfill" -channel alpha -blur 0x2 -level 50x100% +channel result.png

const {
    downloadContentFromMessage
} = require("@adiwajshing/baileys");
const fs = require('fs-extra')
const {
    Sticker,
    StickerTypes
} = require("wa-sticker-formatter");
const im = require('imagemagick')
const {
    cwd
} = require('process');
const { logger } = require("../../../helpers");

const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

module.exports.command = () => {
    return {
        cmd: 'sticker-nobg',

        desc: 'Membuat stiker dari gambar tanpa background putih',

        handler: async (sock, msg, from, args, msgInfoObj) => {
            let {
                type,
                isTaggedImage,
                isTaggedVideo,
                reply
            } = msgInfoObj;

            try {
                let packName = "My Sticker";
                let authorName = "Barbara";
                let downloadFilePath;
                const stickerFileName = cwd() + '/tmp/' + getRandom('');
                let stream;

                //for image
                if (type === "imageMessage" || isTaggedImage) {
                    if (msg.message.imageMessage) {
                        downloadFilePath = msg.message.imageMessage;
                    } else {
                        //tagged image
                        downloadFilePath =
                            msg.message.extendedTextMessage.contextInfo.quotedMessage
                            .imageMessage;
                    }
                    //for images
                    stream = await downloadContentFromMessage(
                        downloadFilePath,
                        "image"
                    );
                } else if (type === "videoMessage" || isTaggedVideo) {
                    //for videos
                    if (msg.message.videoMessage) {
                        downloadFilePath = msg.message.videoMessage;
                    } else {
                        downloadFilePath =
                            msg.message.extendedTextMessage.contextInfo.quotedMessage
                            .videoMessage;
                    }
                    stream = await downloadContentFromMessage(
                        downloadFilePath,
                        "video"
                    );
                } else {
                    console.log(msg);
                    reply("*Format Salah*\nSilahkan sertakan gambar atau gif");
                    return;
                }


                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                fs.writeFileSync(stickerFileName + '.jpg', buffer);

                let cmd = `convert ${stickerFileName + '.jpg'} -fuzz 2% -fill none -draw "matte 0,0 floodfill" -channel alpha -blur 0x2 -level 50x100% +channel ${stickerFileName + '.png'}`
                const { execSync } = require("child_process");
                execSync(cmd)

                let stickerMake = new Sticker(fs.readFileSync(stickerFileName + '.png'), {
                    pack: packName, // The pack name
                    author: authorName, // The author name
                    type: StickerTypes.FULL,
                    quality: 100,
                });

                await stickerMake.toFile(stickerFileName + '.webp');
                await sock.sendMessage(
                    from, {
                        sticker: fs.readFileSync(stickerFileName + '.webp'),
                    }, {
                        mentions: [from],
                        quoted: msg
                    }
                );
                try {
                    fs.unlinkSync(stickerFileName + '.webp');
                    fs.unlinkSync(stickerFileName + '.jpg');
                    fs.unlinkSync(stickerFileName + '.png');
                } catch {
                    console.log("error in deleting file.");
                }
            } catch (err) {
                reply(err.toString());
            }
        }
    };
};
