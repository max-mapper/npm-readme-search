var ndjson = require('ndjson')
var createServer = require('./server.js')
var path = require('path')

var port = 8877

var searchOpts = {
  path: path.join(__dirname, '..', "npm-readmes.sqlite"),
  primaryKey: 'name',
  columns: ["name", "readme"]
}

createServer(searchOpts, function (err, server) {
  server.listen(port, function(err) {
    if (err) console.error('error!', err)
    console.log('listening on', port)
  })
})