"use strict";
/*jslint todo: true, regexp: true, plusplus: true */
var test = require('tape');
var FakeParams = require('./fake_params.js');

var Dimension = require('../lib/dimension.js');
var sequence = require('../lib/sequence.js').sequence;

test('TimeSeriesDimension', function (t) {
    var d;

    d = new Dimension([{ type: 'timeseries' }]);
    t.deepEqual(d.headers(), sequence(1900, 2050), "Default to 1900..2050");
    t.deepEqual(d.headerHTML(), sequence(1900, 2050), "Titles same as headers (no prefix for yearly range)");
    t.deepEqual(d.dataProperties(), new Array(2050 - 1900 + 1).fill({}), "No data properties set");

    d = new Dimension([{ type: 'timeseries', overall_min: 1990, overall_max: 1995 }]);
    t.deepEqual(d.headers(), sequence(1990, 1995), "Default range sets to overall min/max");
    t.deepEqual(d.headerHTML(), sequence(1990, 1995), "Titles same as headers (no prefix for yearly range)");
    t.deepEqual(d.dataProperties(), new Array(6).fill({}), "No data properties set");
    t.deepEqual(d.parameterHtml(), [
        '<span><label><span lang="en">Years</span>: ',
        '<input type="number" name="min" min="1990" max="1995" step="1" value="1990" />',
        '…',
        '<input type="number" name="max" min="1990" max="1995" step="1" value="1995" />',
        '<select name="period">',
        '<option value="1" selected="selected"><span lang="en">Yearly</span></option>',
        '<option value="1_7"><span lang="en">Bi-annual</span></option>',
        '<option value="1_4_7_10"><span lang="en">Quarterly</span></option>',
        '<option value="1_2_3_4_5_6_7_8_9_10_11_12"><span lang="en">Monthly</span></option>',
        '</select>',
        '</label>&nbsp;</span>',
    ].join("\n"), "2 spinners for min/max, dropdown for period");

    d = new Dimension([{ type: 'timeseries', overall_min: 1990, overall_max: 2000, min: 1995, max: 1999 }]);
    t.deepEqual(d.headers(), sequence(1995, 1999), "Can set min/max within overall values");

    d = new Dimension([{ type: 'timeseries', overall_min: 1990, overall_max: 2000, min: 1995, max: 1996, prefix: 'x' }]);
    t.deepEqual(d.headers(), ['x1995', 'x1996'], "Prefix gets added to headers");
    t.deepEqual(d.headerHTML(), ['<span>x</span>1995', '<span>x</span>1996'], "Prefix gets added to header HTML");

    d = new Dimension([{ type: 'timeseries', overall_min: 1990, overall_max: 2000, min: 1995, max: 1996, prefix: {name: 'x', title: 'y'} }]);
    t.deepEqual(d.headers(), ['x1995', 'x1996'], "Prefix gets added to headers");
    t.deepEqual(d.headerHTML(), ['<span>y</span>1995', '<span>y</span>1996'], "Prefix gets added to header HTML");

    d = new Dimension([{ type: 'timeseries', overall_min: 1990, overall_max: 1992, allowed_periods: ['quarterly', 'monthly'] }]);
    t.deepEqual(d.parameterHtml(), [
        '<span><label><span lang="en">Years</span>: ',
        '<input type="number" name="min" min="1990" max="1992" step="1" value="1990" />',
        '…',
        '<input type="number" name="max" min="1990" max="1992" step="1" value="1992" />',
        '<select name="period">',
        '<option value="1_4_7_10" selected="selected"><span lang="en">Quarterly</span></option>',
        '<option value="1_2_3_4_5_6_7_8_9_10_11_12"><span lang="en">Monthly</span></option>',
        '</select>',
        '</label>&nbsp;</span>',
    ].join("\n"), "2 spinners for min/max, dropdown only contains allowed periods, selects first by default");
    t.deepEqual(d.headers(), [
        '1990_1',
        '1990_4',
        '1990_7',
        '1990_10',
        '1991_1',
        '1991_4',
        '1991_7',
        '1991_10',
        '1992_1',
        '1992_4',
        '1992_7',
        '1992_10',
    ], "Header range gets quarterly postfix");
    t.deepEqual(d.headerHTML(), [
        '1990 1–3',
        '1990 4–6',
        '1990 7–9',
        '1990 10–12',
        '1991 1–3',
        '1991 4–6',
        '1991 7–9',
        '1991 10–12',
        '1992 1–3',
        '1992 4–6',
        '1992 7–9',
        '1992 10–12',
    ], "Header HTML range gets quarterly postfix");

    t.end();
});

test('TimeSeriesDimension:update_init', function (t) {
    var d;

    d = new Dimension([{ type: 'timeseries', min: 1995, max: 1999 }]);
    t.deepEqual(d.headers(), sequence(1995, 1999), "Set to 1995..1999");

    d.update_init([]);
    t.deepEqual(d.headers(), sequence(1995, 1999), "Set to 1995..1999 (empty update_init does nothing)");

    d.update_init(['1996', '1997', '1998']);
    t.deepEqual(d.headers(), ['1996', '1997', '1998'], "update_init() sets range");
    t.deepEqual(d.parameterHtml(), [
        '<span><label><span lang="en">Years</span>: ',
        '<input type="number" name="min" min="1900" max="2050" step="1" value="1996" />',
        '…',
        '<input type="number" name="max" min="1900" max="2050" step="1" value="1998" />',
        '<select name="period">',
        '<option value="1" selected="selected"><span lang="en">Yearly</span></option>',
        '<option value="1_7"><span lang="en">Bi-annual</span></option>',
        '<option value="1_4_7_10"><span lang="en">Quarterly</span></option>',
        '<option value="1_2_3_4_5_6_7_8_9_10_11_12"><span lang="en">Monthly</span></option>',
        '</select>',
        '</label>&nbsp;</span>',
    ].join("\n"), "Spinners, dropdown updated");

    d.update_init(['1997_1', '1997_7', '1998_1', '1998_7']);
    t.deepEqual(d.headers(), ['1997_1', '1997_7', '1998_1', '1998_7'], "update_init() sets range");
    t.deepEqual(d.parameterHtml(), [
        '<span><label><span lang="en">Years</span>: ',
        '<input type="number" name="min" min="1900" max="2050" step="1" value="1997" />',
        '…',
        '<input type="number" name="max" min="1900" max="2050" step="1" value="1998" />',
        '<select name="period">',
        '<option value="1"><span lang="en">Yearly</span></option>',
        '<option value="1_7" selected="selected"><span lang="en">Bi-annual</span></option>',
        '<option value="1_4_7_10"><span lang="en">Quarterly</span></option>',
        '<option value="1_2_3_4_5_6_7_8_9_10_11_12"><span lang="en">Monthly</span></option>',
        '</select>',
        '</label>&nbsp;</span>',
    ].join("\n"), "Spinners, dropdown updated");

    t.end();
});


test('TimeSeriesDimension:update', function (t) {
    var d, fp;

    d = new Dimension([{ type: 'timeseries', min: 1995, max: 1999 }]);
    t.deepEqual(d.headers(), sequence(1995, 1999), "Set to 1995..1999");

    fp = new FakeParams([
        { name: 'min', value: 1995, min: 0 },
        { name: 'max', value: 1996, min: 100 },
        { name: 'period', options: [{selected: true, value: '12'}] },
    ]);
    t.deepEqual(d.update(fp, fp.target(0, 'max')), [
        { name: 'remove', idx: 2, count: 3 },
    ], "Delete last 2");
    t.deepEqual(d.headers(), ['1995', '1996'], "Headers now 1995..1996");

    fp = new FakeParams([
        { name: 'min', value: 1995, min: 0 },
        { name: 'max', value: 1996, min: 100 },
        { name: 'period', options: [{selected: true, value: '1_4_7_10'}] },
    ]);
    t.deepEqual(d.update(fp, fp.target(0, 'max')), [
        { name: 'insert', idx: 1, count: 3 },
        { name: 'insert', idx: 0, count: 3 }
    ], "3 more headers for each year");
    t.deepEqual(d.headers(), ['1995_1', '1995_4', '1995_7', '1995_10', '1996_1', '1996_4', '1996_7', '1996_10'], "Headers now 1995..1996, quarterly");

    fp = new FakeParams([
        { name: 'min', value: 1995, min: 0 },
        { name: 'max', value: 1996, min: 100 },
        { name: 'period', options: [{selected: true, value: '6_12'}] },
    ]);
    t.deepEqual(d.update(fp, fp.target(0, 'max')), [
        { name: 'remove', idx: 4, count: 2 },
        { name: 'remove', idx: 0, count: 2 },
    ], "2 less headers for each year");
    t.deepEqual(d.headers(), ['1995_6', '1995_12', '1996_6', '1996_12'], "Headers now 1995..1996, bi-annual");

    fp = new FakeParams([
        { name: 'min', value: 1995, min: 0 },
        { name: 'max', value: 1997, min: 100 },
        { name: 'period', options: [{selected: true, value: '6_12'}] },
    ]);
    t.deepEqual(d.update(fp, fp.target(0, 'max')), [
        { name: 'insert', idx: 4, count: 2 },
    ], "Extra year, both periods");
    t.deepEqual(d.headers(), ['1995_6', '1995_12', '1996_6', '1996_12', '1997_6', '1997_12'], "Headers now 1995..1997, bi-annual");

    t.end();
});
