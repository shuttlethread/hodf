"use strict";
/*jslint todo: true, regexp: true, plusplus: true */
var test = require('tape');

var Dimension = require('../lib/dimension.js');
var sequence = require('../lib/sequence.js').sequence;

function FakeParams(min, max) {
    this.param_els = [
        [{ name: 'min', value: min, min: 0 }, { name: 'max', value: max, min: 100 }],
    ];

    // Find first fake input in (p_el) that matches (name)
    function by_name(p_el, name) {
        var i;

        for (i = 0; i < p_el.length; i++) {
            if (p_el[i].name === name) {
                return p_el[i];
            }
        }
    }

    // Fake being the parent node by providing childNodes & querySelector to get elements within each
    this.childNodes = this.param_els.map(function (p_el) {
        return {
            querySelector: function (sel) {
                var m = sel.match("input\\[name=(.*)\\]");

                if (m) {
                    return by_name(p_el, m[1]);
                }
                throw new Error("Unknown selector " + sel);
            },
        };
    });

    // Find item by name so we can claim that was the target
    this.target = function (idx, name) {
        return by_name(this.param_els[idx], name);
    };
}

test('Dimension:SingleDimension', function (t) {
    var d;

    d = new Dimension([
        {name: 'l0'},
        {name: 'l1', title: 'Item 1', content: [1, 2]},
        {name: 'l2', title: {'en': 'Item 2', 'ge': 'ნივთი 2'}},
    ]);

    t.deepEqual(d.headers(), ['l0', 'l1', 'l2'], "Headers uses names");

    t.deepEqual(d.headerHTML('en'), [
        '<span>l0</span>',
        '<span>Item 1</span>',
        '<span lang="en">Item 2</span>',
    ], "Header HTML use (translated) titles, if available (en)");
    t.deepEqual(d.headerHTML('ge'), [
        '<span>l0</span>',
        '<span>Item 1</span>',
        '<span lang="ge">ნივთი 2</span>',
    ], "Header HTML use (translated) titles, if available (ge)");

    t.deepEqual(d.parameterHtml(), '<span></span><span></span><span></span>', "Empty parameter HTML, but spans match dimensions");

    t.deepEqual(d.dataProperties(), [
        {},
        { type: 'dropdown', source: [1, 2] },
        {},
    ], "Data properties are filled in where available");

    d.update_init([]);
    t.deepEqual(d.headers(), ['l0', 'l1', 'l2'], "update_init() does nothing");
    d.update_init(['l0', 'l2', 'l3', 'l99']);
    t.deepEqual(d.headers(), ['l0', 'l1', 'l2'], "update_init() does nothing");

    t.end();
});

test('Dimension:RangeDimension', function (t) {
    var d, fp;

    d = new Dimension([{ type: 'range' }]);
    t.deepEqual(d.headers(), sequence(1, 100), "Default to 1..100");
    t.deepEqual(d.headerHTML(), sequence(1, 100), "Titles same as headers (no prefix)");
    t.deepEqual(d.parameterHtml(), [
        '<span><label>Min: <input type="number" name="min" min="1" max="100" step="1" value="1" /></label>',
        '<label>Max: <input type="number" name="max" min="1" max="100" step="1" value="100" /></label></span>',
    ].join("\n"), "2 spinners for min/max");
    t.deepEqual(d.dataProperties(), new Array(100).fill({}), "No data properties set");

    d = new Dimension([{ type: 'range', overall_min: 10, overall_max: 20, min: 15, max: 17 }]);
    t.deepEqual(d.headers(), ['15', '16', '17'], "Default to 15..17");
    t.deepEqual(d.headerHTML(), ['15', '16', '17'], "Titles same as headers (no prefix)");
    t.deepEqual(d.parameterHtml(), [
        '<span><label>Min: <input type="number" name="min" min="10" max="20" step="1" value="15" /></label>',
        '<label>Max: <input type="number" name="max" min="10" max="20" step="1" value="17" /></label></span>',
    ].join("\n"), "2 spinners for min/max, populated with overall settings");
    t.deepEqual(d.dataProperties(), new Array(3).fill({}), "No data properties set");

    d = new Dimension([{
        type: 'range',
        overall_min: 10,
        overall_max: 20,
        min: 15,
        max: 17,
        prefix: {name: 'it_', title: {'en': 'Item ', 'ge': 'ნივთი '}},
        content: [1, 2],
    }]);
    t.deepEqual(d.headers(), ['it_15', 'it_16', 'it_17'], "Names get prefix");
    t.deepEqual(d.headerHTML('en'), [
        '<span lang="en">Item </span>15',
        '<span lang="en">Item </span>16',
        '<span lang="en">Item </span>17',
    ], "Headings get translated title prefix (en)");
    t.deepEqual(d.headerHTML('ge'), [
        '<span lang="ge">ნივთი </span>15',
        '<span lang="ge">ნივთი </span>16',
        '<span lang="ge">ნივთი </span>17',
    ], "Headings get translated title prefix (ge)");
    t.deepEqual(d.parameterHtml(), [
        '<span><label><span lang="en">Item </span>Min: <input type="number" name="min" min="10" max="20" step="1" value="15" /></label>',
        '<label><span lang="en">Item </span>Max: <input type="number" name="max" min="10" max="20" step="1" value="17" /></label></span>',
    ].join("\n"), "2 spinners for min/max, populated with overall settings");
    t.deepEqual(d.dataProperties(), new Array(3).fill({ type: 'dropdown', source: [1, 2] }), "All data properties match");

    d = new Dimension([{ type: 'range' }]);
    d.update_init([]);
    t.deepEqual(d.headers(), sequence(1, 100), "update_init with nothing, stuck to default");
    d.update_init(null);
    t.deepEqual(d.headers(), sequence(1, 100), "update_init with nothing, stuck to default");
    d.update_init(['10', '11', '12']);
    t.deepEqual(d.headers(), ['10', '11', '12'], "Copied all headers when all match sequence");
    d.update_init(['10', '11', '12', '9', '10']);
    t.deepEqual(d.headers(), ['10', '11', '12'], "Ignored extra headers when sequence doesn't match");
    d.update_init(['10', '11', '12', 'x', 'y']);
    t.deepEqual(d.headers(), ['10', '11', '12'], "Ignored extra headers when sequence doesn't match");

    d = new Dimension([{ type: 'range', min: 10, max: 20 }]);
    t.deepEqual(d.headers(), sequence(10, 20), "Start with 10..20");
    fp = new FakeParams(10, 17);
    t.deepEqual(d.update(fp, fp.target(0, 'max')), [
        { name: 'remove', idx: 8, count: 3 },
    ], "Delete last 3");
    t.deepEqual(d.headers(), sequence(10, 17), "Headers now 10..17");

    fp = new FakeParams(7, 19);
    t.deepEqual(d.update(fp, fp.target(0, 'max')), [
        { name: 'insert', idx: 0, count: 3 },
        { name: 'insert', idx: 11, count: 2 },
    ], "Add to beginning and end");
    t.deepEqual(d.headers(), sequence(7, 19), "Headers now 7..19");

    fp = new FakeParams(7, 5);
    t.deepEqual(d.update(fp, fp.target(0, 'max')), [
        { name: 'insert', idx: 0, count: 2 },  // 7 down to 5
        { name: 'remove', idx: 1, count: 14 },  // NB: This is trying to remove nonexistant headers, assuming counts match
    ], "Throw away all existing entries");
    t.deepEqual(d.headers(), sequence(5, 5), "Headers now 5...5 (min adjusted to match max)");

    t.end();
});


test('Dimension:to_hot_properties', function (t) {
    function thp(param) {
        var d = new Dimension([{name: 'l0', content: param}]);
        return d.dataProperties()[0];
    }

    t.deepEqual(thp("numeric"), { type: 'numeric', allowInvalid: false }, "Numeric");
    t.deepEqual(thp([1, 2]), { type: 'dropdown', source: [1, 2] }, "Vocab");

    t.end();
});
