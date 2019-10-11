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
        '<option value="12" selected="selected"><span>Yearly</span></option>',
        '<option value="6_12"><span>Bi-annual</span></option>',
        '<option value="3_6_9_12"><span>Quarterly</span></option>',
        '<option value="1_2_3_4_5_6_7_8_9_10_11_12"><span>Monthly</span></option>',
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
        '<option value="3_6_9_12" selected="selected"><span>Quarterly</span></option>',
        '<option value="1_2_3_4_5_6_7_8_9_10_11_12"><span>Monthly</span></option>',
        '</select>',
        '</label>&nbsp;</span>',
    ].join("\n"), "2 spinners for min/max, dropdown only contains allowed periods, selects first by default");
    t.deepEqual(d.headers(), [
        '1990_3',
        '1990_6',
        '1990_9',
        '1990_12',
        '1991_3',
        '1991_6',
        '1991_9',
        '1991_12',
        '1992_3',
        '1992_6',
        '1992_9',
        '1992_12',
    ], "Header range gets quarterly postfix");
    t.deepEqual(d.headerHTML(), [
        '1990 3',
        '1990 6',
        '1990 9',
        '1990 12',
        '1991 3',
        '1991 6',
        '1991 9',
        '1991 12',
        '1992 3',
        '1992 6',
        '1992 9',
        '1992 12',
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
        '<option value="12" selected="selected"><span>Yearly</span></option>',
        '<option value="6_12"><span>Bi-annual</span></option>',
        '<option value="3_6_9_12"><span>Quarterly</span></option>',
        '<option value="1_2_3_4_5_6_7_8_9_10_11_12"><span>Monthly</span></option>',
        '</select>',
        '</label>&nbsp;</span>',
    ].join("\n"), "Spinners, dropdown updated");

    d.update_init(['1997_6', '1997_12', '1998_6', '1998_12']);
    t.deepEqual(d.headers(), ['1997_6', '1997_12', '1998_6', '1998_12'], "update_init() sets range");
    t.deepEqual(d.parameterHtml(), [
        '<span><label><span lang="en">Years</span>: ',
        '<input type="number" name="min" min="1900" max="2050" step="1" value="1997" />',
        '…',
        '<input type="number" name="max" min="1900" max="2050" step="1" value="1998" />',
        '<select name="period">',
        '<option value="12"><span>Yearly</span></option>',
        '<option value="6_12" selected="selected"><span>Bi-annual</span></option>',
        '<option value="3_6_9_12"><span>Quarterly</span></option>',
        '<option value="1_2_3_4_5_6_7_8_9_10_11_12"><span>Monthly</span></option>',
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
        { name: 'period', options: [{selected: true, value: '3_6_9_12'}] },
    ]);
    t.deepEqual(d.update(fp, fp.target(0, 'max')), [
        { name: 'insert', idx: 1, count: 3 },
        { name: 'insert', idx: 0, count: 3 }
    ], "3 more headers for each year");
    t.deepEqual(d.headers(), ['1995_3', '1995_6', '1995_9', '1995_12', '1996_3', '1996_6', '1996_9', '1996_12'], "Headers now 1995..1996, quarterly");

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
