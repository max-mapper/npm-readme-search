var search = require('sqlite-search')
var fs = require('fs')
var ndjson = require('ndjson')
var through = require('through2')

search({path: 'npm-readmes.sqlite', columns: ["name", "readme"]}, function(err, db) {
  if (err) return console.error('err', err)
  var writer = db.createWriteStream()
  process.stdin.pipe(ndjson.parse()).pipe(writer)
  writer.on('finish', function() {
    db.db.close()
  })
})
