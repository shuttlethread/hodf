"use strict";
/*jslint todo: true, regexp: true, browser: true, unparam: true, plusplus: true, bitwise: true, nomen: true */
var test = require('tape');
var proxyquire = require('proxyquire').noCallThru();

var Hodf = proxyquire('../lib/index.js', {
    handsontable: function (el, hotParams) {
        return {
            el: el,
            hotParams: hotParams,
            destroy: function () { this.destroyed = true; },
        };
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

function matchAll(str, regexp_str) {
    var match, regexp = new RegExp(regexp_str, 'g'), out = {};

    match = regexp.exec(str);
    while (match !== null) {
        out[match[0]] = true;
        match = regexp.exec(str);
    }

    return out;
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
        maxRows: 2,
        startCols: 10,
        maxCols: 10,
        fillHandle: { autoInsertRow: false },
        data: [
            [ null, null, null, null, null, null, null, null, null, null ],
            [ null, null, null, null, null, null, null, null, null, null ],
        ],
        cells: hodf.hot.hotParams.cells,
    }, "Initial data headings didn't fit template, so fell back to defaults");

    hodf = new Hodf({
        "title": "Year and bins dimensions",
        "fields": [{"type": "bins", max: 10}],
        "values": [
            { name: "Min Length", title: "Min Length" },
            { type: "year", min: 2000, max: 2000 },
        ],
        "orientation": "vertical",
    }, fake_el(), null);
    t.deepEqual(hodf.hot.hotParams, {
        stretchH: 'all',
        autoWrapRow: true,
        rowHeaders: [ '1', '2', '3', '4', '5', '6', '7', '8', '9', '10' ],
        colHeaders: [ '<span>Min Length</span>', '2000' ],
        startRows: 10,
        maxRows: 10,
        startCols: 2,
        maxCols: 2,
        fillHandle: { autoInsertRow: false },
        data: undefined,
        cells: hodf.hot.hotParams.cells,
    }, "Table formatted vertically");

    hodf = new Hodf({
        "title": "Year and bins dimensions",
        "fields": [{"type": "bins", max: 10}],
        "values": [
            { name: "Min Length", title: "Min Length" },
            { type: "year", min: 2000, max: 2000 },
        ],
    }, fake_el(), [
        [null,          '10', '11'],
        ["Min Length",    1,    2],
        ["2010",          2,    3],
        ["2011",          5,    6],
    ]);
    t.deepEqual(hodf.hot.hotParams, {
        stretchH: 'all',
        autoWrapRow: true,
        rowHeaders: [ '<span>Min Length</span>', '2010', '2011' ],
        colHeaders: [ '10', '11' ],
        startRows: 3,
        maxRows: 3,
        startCols: 2,
        maxCols: 2,
        fillHandle: { autoInsertRow: false },
        data: [ [ 1, 2 ], [ 2, 3 ], [ 5, 6 ] ],
        cells: hodf.hot.hotParams.cells,
    }, "Can use an AofA for initial data");

    t.end();
});

test('constructor:cells', function (t) {
    var hodf;

    hodf = new Hodf({
        "fields": [
            {"name": "species", "title": "Species", "content": ["a", "b", "c", "d"]},
            {"name": "count", "title": "Count", "content": "numeric"},
            {"name": "other", "title": "Other"},
        ],
        "values": { type: "year", min: 2000, max: 2005 },
    }, fake_el(), {
        "_headings": { fields: [ "species", "count" ], values: ["2000", "2001", "2002"] },
        species: [ "a", "b", "c" ],
        count: [ 1, 2, 3 ],
        other: [ "", "", ""],
    });
    t.deepEqual(hodf.hot.hotParams.cells(0, 0), { type: 'dropdown', source: [ 'a', 'b', 'c', 'd' ] }, "First is a dropdown");
    t.deepEqual(hodf.hot.hotParams.cells(0, 1), { type: 'numeric', allowInvalid: false }, "Second is numeric");
    t.deepEqual(hodf.hot.hotParams.cells(0, 2), {}, "Third can be anything");
    t.deepEqual(hodf.hot.hotParams.cells(1, 0), { type: 'dropdown', source: [ 'a', 'b', 'c', 'd' ] }, "First is a dropdown");
    t.deepEqual(hodf.hot.hotParams.cells(1, 1), { type: 'numeric', allowInvalid: false }, "Second is numeric");
    t.deepEqual(hodf.hot.hotParams.cells(1, 2), {}, "Third can be anything");

    hodf = new Hodf({
        "fields": [
            {"name": "species", "title": "Species", "content": ["a", "b", "c", "d"]},
            {"name": "count", "title": "Count", "content": "numeric"},
            {"name": "other", "title": "Other"},
        ],
        "values": { type: "year", min: 2000, max: 2005 },
        "orientation": "vertical",
    }, fake_el(), {
        "_headings": { fields: [ "species", "count" ], values: ["2000", "2001", "2002"] },
        species: [ "a", "b", "c" ],
        count: [ 1, 2, 3 ],
        other: [ "", "", ""],
    });
    // NB: Cols/rows are reversed now
    t.deepEqual(hodf.hot.hotParams.cells(0, 0), { type: 'dropdown', source: [ 'a', 'b', 'c', 'd' ] }, "First is a dropdown");
    t.deepEqual(hodf.hot.hotParams.cells(1, 0), { type: 'numeric', allowInvalid: false }, "Second is numeric");
    t.deepEqual(hodf.hot.hotParams.cells(2, 0), {}, "Third can be anything");
    t.deepEqual(hodf.hot.hotParams.cells(0, 1), { type: 'dropdown', source: [ 'a', 'b', 'c', 'd' ] }, "First is a dropdown");
    t.deepEqual(hodf.hot.hotParams.cells(1, 1), { type: 'numeric', allowInvalid: false }, "Second is numeric");
    t.deepEqual(hodf.hot.hotParams.cells(2, 1), {}, "Third can be anything");

    t.end();
});

test('replace', function (t) {
    var hodf, new_hodf;

    hodf = new Hodf({
        "title": { en: "Year and bins dimensions", ge: "წელი და ურნების ზომები" },
        "fields": [{"type": "bins", max: 10}],
        "values": [
            { name: "Min Length", title: "Min Length" },
            { type: "year", min: 2000, max: 2000 },
        ],
    }, fake_el(), undefined, 'ge');
    t.deepEqual(matchAll(hodf.el.innerHTML, '<h3 .*?</h3>'), {
        '<h3 lang="ge">წელი და ურნების ზომები</h3>': true,
    }, "Only georgian title present (intial_lang = ge)");

    new_hodf = hodf.replace({ "_headings": { fields: ["1"], values: ["Min Length", "2001"] } });
    t.deepEqual(matchAll(new_hodf.el.innerHTML, '<h3 .*?</h3>'), {
        '<h3 lang="ge">წელი და ურნების ზომები</h3>': true,
    }, "Only georgian title present after replace()");

    t.end();
});
