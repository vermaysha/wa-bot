const P = require("pino")
const { promisify } = require('util')
const { readdir } = require('fs')
const { cwd } = require('process')

const scandir = promisify(readdir);

exports.logger = P({
    level: "warn",
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            hideObject: true,
            translateTime: true,
            crlf: true,
        }
    }
})

exports.getGroupAdmins = (participants) => {
    admins = [];
    for (let memb of participants) {
        memb.admin ? admins.push(memb.id) : "";
    }
    return admins;
};

exports.parseSession = (session) => {
    if (!session) {
        return false
    }
    session.creds.noiseKey.private = Buffer.from(session.creds.noiseKey.private)
    session.creds.noiseKey.public = Buffer.from(session.creds.noiseKey.public)

    session.creds.signedIdentityKey.private = Buffer.from(session.creds.signedIdentityKey.private)
    session.creds.signedIdentityKey.public = Buffer.from(session.creds.signedIdentityKey.public)

    session.creds.signedPreKey.keyPair.private = Buffer.from(session.creds.signedPreKey.keyPair.private)
    session.creds.signedPreKey.keyPair.public = Buffer.from(session.creds.signedPreKey.keyPair.public)

    session.creds.signedPreKey.signature = Buffer.from(session.creds.signedPreKey.signature)

    session.creds.signalIdentities[0].identifierKey = Buffer.from(session.creds.signalIdentities[0].identifierKey)

    // Assumse as new clear devices
    session.creds.nextPreKeyId = 1
    session.creds.firstUnuploadedPreKeyId = 1
    session.creds.processedHistoryMessages = []
    return session
}

exports.sanitizePhone = (number) => {
    if (number.includes(':'))
        return number.slice(0, number.search(":")) + number.slice(number.search("@"))
    return number
}

exports.unknownCmd = async (sock, msg, from, prefix) => {
    sock.sendMessage(
        from, {
            text: `Send ${prefix}help for BOT commands!`,
        }, {
            quoted: msg
        }
    );
}

exports.registerCmd = async () => {
    console.log("Commands Added!");

    let paths = {
        cmdPublic: cwd() + '/bot/commands/public/',
        cmdGroupMember: cwd() + '/bot/commands/group/member/',
        cmdGroupAdmin: cwd() + '/bot/commands/group/admin/',
        cmdOwner: cwd() + '/bot/commands/owner/'
    }

    let retCmds = {};

    for (const key in paths) {
        let cmds = []
        let filenames = await scandir(paths[key]);
        filenames.forEach((file) => {
            if (file.endsWith(".js")) {
                let {
                    command
                } = require(paths[key] + file);
                
                let cmdinfo = command();
                cmds[cmdinfo.cmd] = {
                    run: cmdinfo.handler,
                    desc: cmdinfo.desc
                };
            }
        });
        retCmds[key] = cmds
    }

    return retCmds
}
