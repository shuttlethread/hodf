"use strict";
/*jslint todo: true, regexp: true, plusplus: true, browser: true, nomen: true */
var Hodataframe = require('../lib/index.js');
var fs = require('fs');

var templates = [
    {
        "title": "Use of 'content' to control cell contents",
        "fields": [
            {"name": "country", "title": "Country", "content": [
                "Iceland",
                "Norway",
                "Finland"
            ]},
            {"name": "formation", "title": "Formation", "content": "date"},
            {"name": "population", "title": "Population", "content": "numeric"},
        ],
        "values": [{"name": "A"}, {"name": "B"}],
    },

    {
        "title": "Using 'content' as part of a flexible number of columns",
        "fields": {
            type: "bins",
            max: 3,
            prefix: {name: 'species_', title: 'Species '},
            content: 'numeric',
        },
        "values": [{"name": "A"}, {"name": "B"}],
    }
];

// Inject the handsontable CSS into the page
fs.readFile(__dirname + '/../node_modules/handsontable/dist/handsontable.full.min.css', 'utf8', function (err, out) {
    var css_el = document.createElement('style');

    if (err) {
        throw err;
    }
    css_el.innerText = out;
    document.head.appendChild(css_el);
});

// Turn each HODF into a template
templates.map(function (tmpl) {
    var containing_el = document.createElement('DIV');

    document.body.appendChild(containing_el);
    return new Hodataframe(tmpl, containing_el);
});
