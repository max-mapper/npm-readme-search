var classie = require('classie')
var Ractive = require('ractive')
var nets = require('nets')
var on = require('component-delegate').bind
var marked = require('marked')
var qs = require('querystring')

var BASE_URL = 'http://localhost:8877'
var SEARCH_PATH = '/search/readme/'
var searchResults = new Ractive({
  el: '.morphsearch-content .dummy-column',
  template: require( '../templates/list.html' ),
  data: {
    name: 'Results',
    items: []
  }
})

var itemResult = new Ractive({
  el: '.morphsearch-content .text-content',
  template: require( '../templates/text.html' ),
  data: {
    name: 'Readme',
    item: {}
  }
})

var ITEM_LOOKUP = {}

var morphSearch = document.getElementById('morphsearch')
var input = morphSearch.querySelector('input.morphsearch-input')
var ctrlClose = morphSearch.querySelector('span.morphsearch-close')
var isOpen = isAnimating = false

// events
input.addEventListener('focus', toggleSearch)
input.addEventListener('keydown', toggleSearch)
ctrlClose.addEventListener('click', toggleSearch)

// esc key closes search overlay
// keyboard navigation events
document.addEventListener('keydown', function(ev) {
	var keyCode = ev.keyCode || ev.which
	if (keyCode === 27 && isOpen) {
		toggleSearch(ev)
	}
})

function addItems (items) {
  for (i in items) {
    var item = items[i]
    ITEM_LOOKUP[item.name] = item
  }
  var manymoreitems = searchResults.get('items').concat(items)
  searchResults.set('items', manymoreitems)
}

on(document, '.search-result', 'click', function(ev) {
  console.log(ev)
  var name = ev.target.innerText
  var item = ITEM_LOOKUP[name]
  if (!item.marked) {
    item.marked = true
    item.readme = marked(item.readme)
  }
  itemResult.set('item', item)
  ev.preventDefault()
})

var next = null
var currentTerm = null

morphSearch.querySelector('button[type="submit"]').addEventListener('click', function(ev) {
  ev.preventDefault()

  currentTerm = input.value
  if (!currentTerm) return
  doSearch(currentTerm, {limit: 50}, function (json) {
    searchResults.set('items', [])
    addItems(json.rows)
  })
})

function doSearch(term, query, cb) {
  if (typeof query == 'object') {
    query = '?' + qs.stringify(query)
  }
  nets({
    url: BASE_URL + SEARCH_PATH + encodeURIComponent(term) + query,
    json: true
  }, function(err, resp, json) {
    if (err) return handleError(err)
    next = json.next
    cb(json)
  })
}

loading(false)

function loading(val) {
  searchResults.set('loading', val)
}

function isLoading() {
  return searchResults.get('loading')
}

function fetchMore (cb) {
  if (!isLoading()) {
    loading(true)
    doSearch(currentTerm, next, function (json) {
      addItems(json.rows)
      loading(false)
    })
  }
}

function handleError(err) {
  alert(err)
}

// show/hide search area
function toggleSearch(evt) {
	// return if open and the input gets focused
  var eventName = evt.type.toLowerCase()
	if ((eventName === 'focus' || eventName === 'keydown') && isOpen) return false

	if (isOpen) {
		classie.remove(morphSearch, 'open')
    searchResults.set('items', [])
    itemResult.set('item', null)

		// trick to hide input text once the search overlay closes
		// todo: hardcoded times, should be done after transition ends
		if (input.value !== '') {
			setTimeout(function() {
				classie.add(morphSearch, 'hideInput')
				setTimeout(function() {
					classie.remove(morphSearch, 'hideInput')
					input.value = ''
				}, 300)
			}, 500)
		}

		input.blur()
	} else {
		classie.add(morphSearch, 'open')
	}
	isOpen = !isOpen
}

var scrollTarget = document.getElementsByClassName('dummy-column')[0];

window.onscroll = function (event) {
  var target = scrollTarget.scrollHeight
  var scrollPos = window.scrollY + window.innerHeight
  if (scrollPos >= target) {
    fetchMore()
  }
}
on(document, '.next', 'click', function(ev) {
  ev.preventDefault()
})
