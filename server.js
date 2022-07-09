const express = require('express')
const bodyParser = require('body-parser')
const process = require('process')
const os = require('os')
const app = express()
const { logger } = require('./helpers')

function format(seconds) {
  function pad(s) {
    return (s < 10 ? '0' : '') + s;
  }
  var hours = Math.floor(seconds / (60 * 60));
  var minutes = Math.floor(seconds % (60 * 60) / 60);
  var seconds = Math.floor(seconds % 60);

  return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}

exports.server = () => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  app.get('/', (req, res) => {
    res.json({
      'api-status': 'online',
      'bot-status': 'online/offline',
      'app-uptime': format(process.uptime()),
      'os-uptime': format(os.uptime())
    })
  })

  let port = process.env.PORT || 3000

  console.log(`Server listen to port ${port}`)
  app.listen(port)
}
