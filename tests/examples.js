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
            type: "range",
            min: 10,
            max: 13,
            prefix: {name: 'species_', title: 'Species '},
        },
        "values": [{"name": "A"}, {"name": "B"}],
    },

    {
        "title": "Initial data",
        "fields": [{"name": "A"}, {"name": "B"}],
        "values": {
            type: "range",
            min: 10,
            max: 13,
            prefix: {name: 'species_', title: 'Species '},
        },
        "orientation": "vertical",
        "init_data": {
            "_headings": { fields: ["A", "B"], values: ["10", "11", "12", "13"] },
            "A": [0, 1, 2, 3],
            "B": [0, 1, 2, 3],
        }
    },

    {
        "title": "Multiple ranges in cols and rows",
        "fields": [
            {
                type: "range",
                min: 11,
                max: 13,
                prefix: 'A',
                content: 'numeric',
            },
            {
                type: "range",
                min: 21,
                max: 23,
                prefix: 'B',
                content: ['a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'b3', 'b4'],
            },
        ],
        "values": [
            {
                type: "range",
                min: 10,
                max: 13,
                prefix: {name: 'species_', title: 'Species '},
            },
            {
                type: "range",
                min: 1,
                max: 3,
                overall_max: 10,
                prefix: {name: 'areas_', title: 'Areas '},
            },
        ],
        "orientation": "vertical",
        "init_data": {
            "_headings": {
                fields: ["A11", "A12", "A13", "B21", "B22", "B23"],
                values: ["species_10", "species_11", "species_12", "species_13", "areas_1", "areas_2", "areas_3"],
            },
            "A11": [110, 111, 112, 113, "1", "2", "3"],
            "A12": [120, 121, 122, 123, "1", "2", "3"],
            "A13": [130, 131, 132, 133, "1", "2", "3"],
            "B21": ['a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'b3'],
            "B22": ['b1', 'b2', 'b3', 'b4', 'a1', 'a2', 'a3'],
            "B23": ['a1', 'b2', 'a3', 'b4', 'a1', 'b2', 'a3'],
        },
    },

    {
        "title": "Year and bins dimensions",
        "fields": [{"name": "A"}, {"name": "B"}],
        "values": [
            {"type": "timeseries", min: 1990, max: 1993},
            {"type": "bins", "prefix": {"name": "bin_", "title": "Bin "}, max: 5},
        ],
        "orientation": "vertical",
        "init_data": {
            "_headings": { fields: ["A", "B"], values: ["2001_6", "2001_12", "bin_1", "bin_2"] },
            "A": [0, 1, 2, 3],
            "B": [0, 1, 2, 3],
        }
    },
    {
        "title": "Year and bins dimensions, forced start month",
        "fields": [{"name": "A"}, {"name": "B"}],
        "values": [
            {"type": "timeseries", min: 1990, max: 1993, start_month: 1},
            {"type": "bins", "prefix": {"name": "bin_", "title": "Bin "}, max: 5},
        ],
        "orientation": "vertical",
        "init_data": {
            "_headings": { fields: ["A", "B"], values: ["2001_1", "2001_7", "bin_1", "bin_2"] },
            "A": [0, 1, 2, 3],
            "B": [0, 1, 2, 3],
        }
    },

    {
        "title": "Optional dimensions",
        "fields": [
            { "type": "optional", "name": "carrots", "title": "Carrots" },
            { "type": "optional", "name": "parsnips", "title": "Parsnips" },
        ],
        "values": [
            {"name": "fridge"},
            {"name": "larder"},
        ],
        "init_data": {
            "_headings": { fields: ["carrots"], values: ["fridge", "larder"] },
            "carrots": [1, 2],
        }
    },

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

// Add language-handling CSS
(function () {
    var el;

    el = document.createElement('style');
    el.innerText = [
        "html:lang(en) *[lang]:not(:lang(en)) { display: none; }",
        "html:lang(es) *[lang]:not(:lang(es)) { display: none; }",
        "html:lang(fr) *[lang]:not(:lang(fr)) { display: none; }",
        "html *[lang].always-visible { display: inherit !important; }",
    ].join("\n");
    document.head.appendChild(el);

    el = document.createElement('div');
    el.innerHTML = [
        "<a href=\"javascript:\" onclick=\"document.documentElement.lang = 'en'\">en</a>",
        "<a href=\"javascript:\" onclick=\"document.documentElement.lang = 'es'\">es</a>",
        "<a href=\"javascript:\" onclick=\"document.documentElement.lang = 'fr'\">fr</a>",
    ].join("\n");
    document.body.appendChild(el);

    document.documentElement.lang = "en";
}());

// Turn each HODF into a template
templates.map(function (tmpl) {
    var containing_el = document.createElement('DIV');

    document.body.appendChild(containing_el);
    return new Hodataframe(tmpl, containing_el, tmpl.init_data, '*');
});
