var search = require('sqlite-search')
var fs = require('fs')
var ndjson = require('ndjson')
var through = require('through2')
var gh = require('github-url-to-object')

search({path: 'npm-readmes.sqlite', columns: ["name", "readme", "github", "author"]}, function(err, searcher) {
  if (err) return console.error('err', err)
  var writer = searcher.createWriteStream()
  process.stdin.pipe(ndjson.parse()).pipe(filter()).pipe(writer)
  writer.on('finish', function() {
    searcher.db.close()
  })
})

function filter() {
  var stream = through.obj(function(obj, enc, next) {
    if (obj.name && obj.readme) {

      if (obj.repository && obj.repository.type == 'git') {
        var ghObj = gh(obj['repository']['url'])
        if (ghObj) {
          obj.github = ghObj['https_url']
        }
      }
      if (obj.author) {
        obj.author = obj['author']['name']
      }
      stream.push(obj)
    }
    next()
  })
  return stream
}
