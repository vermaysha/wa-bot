const {
  downloadContentFromMessage
} = require("@adiwajshing/baileys");
const fs = require('fs')
const {
  Sticker,
  StickerTypes
} = require("wa-sticker-formatter");
const { cwd } = require('process')

const getRandom = (ext) => {
  return `${Math.floor(Math.random() * 10000)}${ext}`;
};

module.exports.command = () => {
  return {
      cmd: 'sticker',

      desc: 'Membuat stiker dari gambar',

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
              const stickerFileName = cwd() +  '/tmp/' + getRandom(".webp");
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

              let stickerMake = new Sticker(buffer, {
                  pack: packName, // The pack name
                  author: authorName, // The author name
                  type: StickerTypes.FULL,
                  quality: 100,
              });

              await stickerMake.toFile(stickerFileName);
              await sock.sendMessage(
                  from, {
                      sticker: fs.readFileSync(stickerFileName),
                  }, {
                      mentions: [from],
                      quoted: msg
                  }
              );
              try {
                  fs.unlinkSync(stickerFileName);
              } catch {
                  console.log("error in deleting file.");
              }
          } catch (err) {
              reply(err.toString());
          }
      }
  };
};
