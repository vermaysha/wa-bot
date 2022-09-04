const { cwd } = require('process')
const { promisify } = require('util')
const { readdir } = require('fs')

const scandir = promisify(readdir);

exports.registerCmd = async () => {
  let paths = {
    cmd: cwd() + '/commands/'
  }

  let retCmds = {}

  for (const key in paths) {
    let cmds = []
    let filenames = await scandir(paths[key])
    filenames.forEach((file) => {
      if (file.endsWith(".js")) {
        let {
          command
        } = require(paths[key] + file)

        let cmdinfo = command()
        cmds[cmdinfo.cmd] = {
          run: cmdinfo.handler,
          desc: cmdinfo.desc
        }
      }
    })
    retCmds[key] = cmds
  }

  return retCmds
}
