"use strict";
/*jslint todo: true, regexp: true, browser: true, unparam: true, plusplus: true, bitwise: true, nomen: true */
var test = require('tape');
var proxyquire = require('proxyquire').noCallThru();

var Hodf = proxyquire('../lib/index.js', {
    handsontable: function (el, hotParams) {
        return { el: el, hotParams: hotParams };
    },
});

function fake_el() {
    var el_hash = ['.hot', '.parameters'].reduce(function (acc, k) {
        acc[k] = {
            selector: k,
            listeners: {},
            addEventListener: function (name, fn) { acc[k].listeners[name] = fn; },
        };
        return acc;
    }, {});

    return {
        innerHTML: '',
        querySelector: function (selector) { return el_hash[selector]; },
    };
}

test('constructor', function (t) {
    var hodf;

    hodf = new Hodf({
        "title": "Year and bins dimensions",
        "fields": [{"type": "bins", max: 10}],
        "values": [
            { name: "Min Length", title: "Min Length" },
            { type: "year", min: 2000, max: 2000 },
        ],
    }, fake_el(), {
        "_headings": { fields: ["X1"], values: ["2001"] },
        "X1": [99],
    });

    t.deepEqual(hodf.hot.hotParams, {
        stretchH: 'all',
        autoWrapRow: true,
        rowHeaders: [ '<span>Min Length</span>', '2001' ],
        colHeaders: [ '1', '2', '3', '4', '5', '6', '7', '8', '9', '10' ],
        startRows: 2,
        startCols: 10,
        data: [
            [ null, null, null, null, null, null, null, null, null, null ],
            [ null, null, null, null, null, null, null, null, null, null ],
        ],
        cells: hodf.hot.hotParams.cells,
    }, "Initial data headings didn't fit template, so fell back to defaults");

    t.end();
});