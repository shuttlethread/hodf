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
