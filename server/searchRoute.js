var formatData = require('format-data')
var qs = require('querystring')
var debug = require('debug')('sqlite-search-route')

module.exports = function(db, opts) {
  var searchOpts = {
    field: opts.column,
    query: opts.term,
    since: opts.since,
    limit: opts.limit,
    select: opts.select || ["*"]
  }

  debug('search', searchOpts)

  var formatOpts = {
    format: "object"
  }

  if (searchOpts.limit) {
    var nextOpts = {
      offset: searchOpts.limit,
      limit: searchOpts.limit
    }

    formatOpts.suffix = ', "next": "?' + qs.stringify(nextOpts) + '"}'
  }

  return db.createSearchStream(searchOpts).pipe(formatData(formatOpts))
}