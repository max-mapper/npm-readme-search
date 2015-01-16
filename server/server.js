var http = require('http')
var sqliteSearch = require('sqlite-search')
var searchRoute = require('./searchRoute.js')
var Routes = require('routes-router')
var extend = require('extend')
var corsify = require('corsify')
var url = require('url')
var qs = require('querystring')

var cors = corsify({
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
})

module.exports = function (searchOpts, cb) {
  sqliteSearch(searchOpts, function(err, db) {
    if (err) console.error('error!', err)

    var router = Routes()
    router.addRoute('/search/:column/:term', function (req, res, opts) {
      // because routes router doesn't parse query strings into opts..??
      var params = extend(qs.decode(opts.parsedUrl.query), opts.params)

      searchRoute(db, params).pipe(res)
    })

    var server = http.createServer(cors(router))
    cb(err, server)
  })
}
