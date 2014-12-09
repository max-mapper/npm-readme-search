var http = require('http')
var sqliteSearch = require('sqlite-search')
var Routes = require('routes-router')
var ecstatic = require('ecstatic')
var ndjson = require('ndjson')
var formatData = require('format-data')

var port = 8877

var searchOpts = {
  path: "npm-readmes.sqlite",
  columns: ["name", "readme"]
}

sqliteSearch(searchOpts, function(err, db) {
  if (err) console.error('error!', err)
    
  var router = Routes()

  router.addRoute('/readme/:name', readme)
  router.addRoute('/search/:column/:term', search)
  router.addRoute("*", ecstatic(__dirname))

  http.createServer(router).listen(port, function(err) {
    if (err) console.error('error!', err)
    console.log('listening on', port)
  })

  function search(req, res, opts) {
    var col = opts.params.column
    var term = opts.params.term
    console.log('search', col, term)
    var searchOpts = {
      field: col,
      query: term,
      select: ["*"]
    }
    db.createSearchStream(searchOpts).pipe(formatData("object")).pipe(res)
  }
  
  function readme(req, res, opts) {
    console.log(opts.params.name)
    var searchOpts = {
      statement: "SELECT * FROM data_search WHERE name='" + opts.params.name + "' LIMIT 1"
    }
    db.createSearchStream(searchOpts).pipe(formatData("object")).pipe(res)
  }
})
