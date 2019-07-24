"use strict";
/*jslint todo: true, regexp: true, plusplus: true */
var test = require('tape');

var get_dimension = require('../lib/hodf_dimensions.js').get_dimension;

test('ListDimension', function (t) {
    var d;

    d = get_dimension({type: 'list', values: [{name: 'l0', title: 'Item 0'}, {name: 'l1', title: 'Item 1'}]});
    t.deepEqual(d.headers(), ['l0', 'l1'], 'Got headers');
    t.deepEqual(d.headerHTML(), ['<span>Item 0</span>', '<span>Item 1</span>'], 'Got header HTML (i.e. pretty titles');
    t.deepEqual(d.minCount(), 2, "Count same as length of values");
    t.deepEqual(d.maxCount(), 2, "Count same as length of values");
    t.deepEqual(d.dataProperties(), [{}, {}], "No data properties by default");

    d = get_dimension({type: 'list', values: [
        {name: 'l0', title: 'Item 0', content: 'numeric', allowInvalid: false},
        {name: 'l1', title: 'Item 1', content: ['a', 'b', 'c']},
        {name: 'l1', title: 'Item 1', content: 'camel', allowInvalid: false},
    ]});
    t.deepEqual(d.dataProperties(), [
        {type: 'numeric', allowInvalid: false},
        {type: 'dropdown', source: [ 'a', 'b', 'c' ]},
        {type: 'camel', allowInvalid: false},
    ], "Data properties set by type, unknown types passed through");

    t.end();
});

test('RangeDimension', function (t) {
    var d, fh;

    function FakeHot(init_headers) {
        var h = init_headers, settings = { colHeaders: init_headers };

        this.getColHeader = function () {
            return h;
        };

        this.getSettings = function () {
            return settings;
        };

        this.alter = function (action, index, amount) {
            var i;

            if (Array.isArray(index)) {
                // Do each alter in turn
                for (i = 0; i < index.length; i++) {
                    this.alter(action, index[i][0], index[i][1]);
                }
                return;
            }
            if (amount && amount !== 1) {
                throw new Error("amount not supported: " + amount);
            }

            if (action === 'insert_col') {
                h.splice(index, 0, '__new');
            } else if (action === 'remove_col') {
                h.splice(index, 1);
            } else {
                throw new Error("Unknown action " + action);
            }
        };

        this.updateSettings = function (new_settings) {
            Object.keys(new_settings).forEach(function (k) {
                if (k === 'colHeaders' && h.length !== new_settings[k].length) {
                    throw new Error("Mismatch columns/headers " + h + "/" + new_settings[k]);
                }
                settings[k] = new_settings[k];
            });
        };
    }

    function FakeParams(min, max) {
        this.querySelector = function (sel) {
            if (sel === "input[name=min]") {
                return { id: "min", value: min, min: 0 };
            }
            if (sel === "input[name=max]") {
                return { id: "max", value: max, min: 100 };
            }
            throw new Error("Unknown selector " + sel);
        };
    }

    d = get_dimension({type: 'bins', max: 10});
    fh = new FakeHot(d.headers());
    t.deepEqual(d.headers(), ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], 'Got initial headers');
    t.deepEqual(d.dataProperties(), [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}], "Got empty properties, one per row");

    d.update(new FakeParams(1, 9), fh, {target: { id: 'max'}});
    t.deepEqual(d.headers(), ['1', '2', '3', '4', '5', '6', '7', '8', '9'], 'Removed one');
    t.deepEqual(fh.getColHeader(), ['1', '2', '3', '4', '5', '6', '7', '8', '9'], 'HOT columns updated');
    t.deepEqual(fh.getSettings().colHeaders, ['1', '2', '3', '4', '5', '6', '7', '8', '9'], 'HOT column labels updated');

    d.update(new FakeParams(1, 13), fh, {target: { id: 'max'}});
    t.deepEqual(d.headers(), ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'], 'Added some');
    t.deepEqual(fh.getColHeader(), ['1', '2', '3', '4', '5', '6', '7', '8', '9', '__new', '__new', '__new', '__new'], 'HOT columns added');
    t.deepEqual(fh.getSettings().colHeaders, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'], 'HOT column labels updated');

    d = get_dimension({type: 'bins', max: 3, content: "numeric"});
    fh = new FakeHot(d.headers());
    t.deepEqual(d.headers(), ['1', '2', '3'], 'Got initial headers');
    t.deepEqual(d.dataProperties(), [{type: "numeric", allowInvalid: false}, {type: "numeric", allowInvalid: false}, {type: "numeric", allowInvalid: false}], "All rows numeric");

    t.end();
});

test('YearDimension', function (t) {
    var yd;

    yd = get_dimension({type: 'year', min: 2000, max: 2010});
    t.deepEqual(
        yd.headers(),
        ['2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010'],
        "Generated consecutive headers"
    );
    t.deepEqual(yd.minCount(), 11, "mincount/maxcount equal");
    t.deepEqual(yd.maxCount(), 11, "mincount/maxcount equal");

    yd = get_dimension({type: 'year', min: 1990, max: 1993});
    t.deepEqual(
        yd.headers(),
        ['1990', '1991', '1992', '1993'],
        "Generated consecutive headers"
    );
    t.deepEqual(yd.minCount(), 4, "mincount/maxcount equal");
    t.deepEqual(yd.maxCount(), 4, "mincount/maxcount equal");

    yd = get_dimension({type: 'year', min: 1990, max: 1993}, ['2000', '2001', '2004']);
    t.deepEqual(
        yd.headers(),
        ['2000', '2001', '2002', '2003', '2004'],
        "Generated consecutive headers based on input data"
    );
    t.deepEqual(yd.minCount(), 5, "mincount/maxcount equal");
    t.deepEqual(yd.maxCount(), 5, "mincount/maxcount equal");

    yd = get_dimension({type: 'year', min: 1990, max: 1993, initial: [{name: 'woo'}, {name: 'yay'}]});
    t.deepEqual(
        yd.headers(),
        ['woo', 'yay', '1990', '1991', '1992', '1993'],
        "Generated consecutive headers with a initial value"
    );
    t.deepEqual(yd.minCount(), 6, "mincount/maxcount equal");
    t.deepEqual(yd.maxCount(), 6, "mincount/maxcount equal");

    yd = get_dimension({type: 'year', min: 1990, max: 1993, initial: [{name: 'woo'}, {name: 'yay'}]}, ['woo', 'yay', '2000', '2001', '2004']);
    t.deepEqual(
        yd.headers(),
        ['woo', 'yay', '2000', '2001', '2002', '2003', '2004'],
        "Generated consecutive headers based on input data with a initial value"
    );
    t.deepEqual(yd.minCount(), 7, "mincount/maxcount equal");
    t.deepEqual(yd.maxCount(), 7, "mincount/maxcount equal");

    yd = get_dimension({type: 'year', min: 1990, max: 1993, initial: [{name: 'woo'}, {name: 'yay'}]}, ['parp', '2000', '2001', '2004']);
    t.deepEqual(
        yd.headers(),
        ['woo', 'yay', '2000', '2001', '2002', '2003', '2004'],
        "Mismatched initial columns ignored"
    );
    t.deepEqual(yd.minCount(), 7, "mincount/maxcount equal");
    t.deepEqual(yd.maxCount(), 7, "mincount/maxcount equal");

    yd = get_dimension({type: 'year', min: 1990, max: 1993, initial: [{name: 'woo'}, {name: 'yay'}], prefix: {name: "y_", title: "Year "}}, ['parp', 'y_2000', 'y_2001', 'y_2004']);
    t.deepEqual(
        yd.headers(),
        ['woo', 'yay', 'y_2000', 'y_2001', 'y_2002', 'y_2003', 'y_2004'],
        "Prefixed columns, used init_headings with values stripped off"
    );
    t.deepEqual(
        yd.headerHTML(),
        ['woo', 'yay', 'Year 2000', 'Year 2001', 'Year 2002', 'Year 2003', 'Year 2004'],
        "HTML headings use different prefix"
    );

    t.end();
});

test('BinsDimension', function (t) {
    var d;

    d = get_dimension({type: 'bins', max: 5});
    t.deepEqual(
        d.headers(),
        ['1', '2', '3', '4', '5'],
        "Generated consecutive headers"
    );
    t.deepEqual(d.minCount(), 5, "mincount/maxcount equal");
    t.deepEqual(d.maxCount(), 5, "mincount/maxcount equal");

    t.end();
});
