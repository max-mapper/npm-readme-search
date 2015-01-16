var test = require('tape')
var sqliteSearch = require('sqlite-search')
var createServer = require('./server.js')
var request = require('request')
var parallel = require('run-parallel')

var searchOpts = {
  path: "npm-readmes.sqlite",
  primaryKey: "name",
  columns: ["name", "readme"]
}

var port = 88888

function startServer (t, cb) {
  createServer(searchOpts, function (err, server) {
    server.listen(port, function (err) {
      cb(err, done)
      function done () {
        t.end()
        server.close()
      }
    })
  })
}

test('can search through api', function (t) {
  startServer(t, function (err, done) {
    t.ifError(err)

    parallel([function (cb) {
      request({
        uri: 'http://localhost:' + port + '/search/readme/node',
        method: 'GET',
        json: true
      }, function (err, resp, json) {
        t.ifError(err)
        t.ok(json.rows, 'rows return on a streamed response')
        cb()
      })
    },
    function (cb) {
      request({
        uri: 'http://localhost:' + port + '/search/readme/node?limit=100',
        method: 'GET',
        json: true
      }, function (err, resp, json) {
        t.ifError(err)
        t.ok(json.rows, 'rows return on pagination')
        t.equals(json.rows.length, 100, 'properly uses limit query option')
        t.ok(json.next, 'paginated search has "next" key')
        cb()
      })
    },
    function (cb) {
      request({
        uri: 'http://localhost:' + port + '/search/readme/node?since="node"&limit=100',
        method: 'GET',
        json: true
      }, function (err, resp, json) {
        t.ifError(err)
        t.ok(json.rows, 'rows return on limit & since')
        t.equals(json.rows.length, 100, 'properly uses limit query option')
        t.ok(json.next, 'paginated search has "next" key')
        cb()
      })
    }], function () {
      done()
    })
  })
})