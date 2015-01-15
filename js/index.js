var classie = require('classie')
var Ractive = require('ractive')
var nets = require('nets')
var on = require('component-delegate').bind
var marked = require('marked')

var baseURL = 'http://localhost:8877'

var searchResults = new Ractive({
  el: '.morphsearch-content .dummy-column',
  template: require( '../templates/list.html' ),
  data: {
    name: 'Results',
    items: []
  }
})

var morphSearch = document.getElementById('morphsearch')
var input = morphSearch.querySelector('input.morphsearch-input')
var textContent = document.querySelector('.text-content')
var ctrlClose = morphSearch.querySelector('span.morphsearch-close')
var isOpen = isAnimating = false

// events
input.addEventListener('focus', toggleSearch)
ctrlClose.addEventListener('click', toggleSearch)

// esc key closes search overlay
// keyboard navigation events
document.addEventListener('keydown', function(ev) {
	var keyCode = ev.keyCode || ev.which
	if (keyCode === 27 && isOpen) {
		toggleSearch(ev)
	}
})

on(document, '.search-result', 'click', function(ev) {
  console.log(ev)
  var name = ev.target.innerText
  nets({url: baseURL + '/readme/' + encodeURIComponent(name), json: true}, function(err, resp, json) {
    if (err) alert(err)
    textContent.innerHTML = marked(json.rows[0].readme)
  })
  ev.preventDefault()
})

morphSearch.querySelector('button[type="submit"]').addEventListener('click', function(ev) {
  var term = input.value
  nets({url: baseURL + '/search/readme/' + encodeURIComponent(term), json: true}, function(err, resp, json) {
    if (err) alert(err)
    searchResults.set('items', json.rows)
  })
  ev.preventDefault()
})

// show/hide search area
function toggleSearch(evt) {
	// return if open and the input gets focused
	if (evt.type.toLowerCase() === 'focus' && isOpen) return false

	if (isOpen) {
		classie.remove(morphSearch, 'open')

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