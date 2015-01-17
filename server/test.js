var test = require('tape')
var sqliteSearch = require('sqlite-search')
var createServer = require('./server.js')
var request = require('request')
var parallel = require('run-parallel')
var path = require('path')

var searchOpts = {
  path: path.join(__dirname, '..', "npm-readmes.sqlite"),
  primaryKey: "name",
  columns: ["name", "readme"]
}

console.log(searchOpts)

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
        t.ok(json.rows, 'rows return properly')
        t.true(json.rows.length > 0, 'returns more than one row')
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
        t.ok(json.rows, 'limit')
        t.equals(json.rows.length, 100, 'uses limit query option')
        t.ok(json.next, 'paginated search has "next" key')
        cb()
      })
    },
    function (cb) {
      request({
        uri: 'http://localhost:' + port + '/search/readme/node?offset=100&limit=100',
        method: 'GET',
        json: true
      }, function (err, resp, json) {
        t.ifError(err)
        t.ok(json.rows, 'limit & offset')
        t.equals(json.rows.length, 100, 'uses limit query option with offset')
        t.ok(json.next, 'paginated search has "next" key')
        console.log(json.next)
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
        t.ok(json.rows, 'limit & since')
        t.equals(json.rows.length, 100, 'properly uses limit query option')
        t.ok(json.next, 'paginated search has "next" key')
        console.log(json.next)
        cb()
      })
    }], function () {
      done()
    })
  })
})


test('next in paginator works as intentded to get next batch', function (t) {
  startServer(t, function (err, done) {
    t.ifError(err)
    request({
      uri: 'http://localhost:' + port + '/search/readme/node?limit=1',
      method: 'GET',
      json: true
    }, function (err, resp, json) {
      t.ifError(err)
      t.ok(json.rows, 'limit & offset')
      t.equals(json.rows.length, 1, 'uses limit query option with offset')
      t.ok(json.next, 'paginated search has "next" key')

      request({
        uri: 'http://localhost:' + port + '/search/readme/node' + json.next,
        method: 'GET',
        json: true
      }, function (err, resp, json2) {
        t.ifError(err)
        t.ok(json2.rows, 'limit & offset')
        t.true(json.rows.length > 0, 'returns at least one item')
        t.true(json.rows[0].name != json2.rows[0].name, 'get different batch on next request')
        t.true(json.rows[0].name < json2.rows[0].name, 'get a greater batch on next request')
        t.equals(json2.rows.length, 1, 'uses limit query option with offset')
        t.ok(json2.next, 'paginated search has "next" key')
        console.log(json2.next)
        done()
      })
    })
  })
})
