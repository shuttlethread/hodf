"use strict";
/*jslint todo: true, regexp: true, plusplus: true */
var test = require('tape');
var FakeParams = require('./fake_params.js');

var Dimension = require('../lib/dimension.js');
var sequence = require('../lib/sequence.js').sequence;

test('TimeSeriesDimension', function (t) {
    var d;

    d = new Dimension([{ type: 'timeseries' }]);
    t.deepEqual(d.headers(), sequence(2000, 2010).map(function (x) { return x + "_1"; }), "Headers have a _1 prefix (default yearly/start month 1)");
    t.deepEqual(d.headerHTML(), sequence(2000, 2010).map(function (x) { return x + " 1"; }), "Titles have a ' 1' prefix (default yearly/start month 1)");
    t.deepEqual(d.dataProperties(), new Array(2010 - 2000 + 1).fill({}), "No data properties set");

    d = new Dimension([{ type: 'timeseries', min: 1990, max: 1995 }]);
    t.deepEqual(d.headers(), sequence(1990, 1995).map(function (x) { return x + "_1"; }), "Default range sets to overall min/max");
    t.deepEqual(d.headerHTML(), sequence(1990, 1995).map(function (x) { return x + " 1"; }), "Titles same as headers");
    t.deepEqual(d.dataProperties(), new Array(1995 - 1990 + 1).fill({}), "No data properties set");
    t.deepEqual(d.parameterHtml(), [
        '<span><label><span lang="en">Years</span>: ',
        '<input type="number" name="min" min="1900" max="2050" step="1" value="1990" />',
        '…',
        '<input type="number" name="max" min="1900" max="2050" step="1" value="1995" />',
        '</label>&nbsp;',
        '<select name="delta">',
        '<option value="12" selected="selected" lang="en">Yearly</option>',
        '<option value="6" lang="en">Bi-annual</option>',
        '<option value="3" lang="en">Quarterly</option>',
        '<option value="1" lang="en">Monthly</option>',
        '</select>',
        '<label><span lang="en">Start Month</span>: ',
        '<input type="number" name="start_month" min="1" max="12" step="1" value="1" />',
        '</label>&nbsp;</span>',
    ].join("\n"), "2 spinners for min/max, dropdown for period, spinner for start month");

    d = new Dimension([{ type: 'timeseries', overall_min: 1990, overall_max: 2005 }]);
    t.deepEqual(d.headers(), sequence(2000, 2005).map(function (x) { return x + "_1"; }), "Default range sets to intersection of 2000..2010 and overall min/max");
    t.deepEqual(d.headerHTML(), sequence(2000, 2005).map(function (x) { return x + " 1"; }), "Titles same as headers");
    t.deepEqual(d.parameterHtml(), [
        '<span><label><span lang="en">Years</span>: ',
        '<input type="number" name="min" min="1990" max="2005" step="1" value="2000" />',
        '…',
        '<input type="number" name="max" min="1990" max="2005" step="1" value="2005" />',
        '</label>&nbsp;',
        '<select name="delta">',
        '<option value="12" selected="selected" lang="en">Yearly</option>',
        '<option value="6" lang="en">Bi-annual</option>',
        '<option value="3" lang="en">Quarterly</option>',
        '<option value="1" lang="en">Monthly</option>',
        '</select>',
        '<label><span lang="en">Start Month</span>: ',
        '<input type="number" name="start_month" min="1" max="12" step="1" value="1" />',
        '</label>&nbsp;</span>',
    ].join("\n"), "2 spinners for min/max, dropdown for period, spinner for start month");

    d = new Dimension([{ type: 'timeseries', overall_min: 2005, overall_max: 2010 }]);
    t.deepEqual(d.headers(), sequence(2005, 2010).map(function (x) { return x + "_1"; }), "Default range sets to intersection of 2000..2010 and overall min/max");
    t.deepEqual(d.headerHTML(), sequence(2005, 2010).map(function (x) { return x + " 1"; }), "Titles same as headers");
    t.deepEqual(d.parameterHtml(), [
        '<span><label><span lang="en">Years</span>: ',
        '<input type="number" name="min" min="2005" max="2010" step="1" value="2005" />',
        '…',
        '<input type="number" name="max" min="2005" max="2010" step="1" value="2010" />',
        '</label>&nbsp;',
        '<select name="delta">',
        '<option value="12" selected="selected" lang="en">Yearly</option>',
        '<option value="6" lang="en">Bi-annual</option>',
        '<option value="3" lang="en">Quarterly</option>',
        '<option value="1" lang="en">Monthly</option>',
        '</select>',
        '<label><span lang="en">Start Month</span>: ',
        '<input type="number" name="start_month" min="1" max="12" step="1" value="1" />',
        '</label>&nbsp;</span>',
    ].join("\n"), "2 spinners for min/max, dropdown for period, spinner for start month");

    d = new Dimension([{ type: 'timeseries', min: 1990, max: 1992, start_month: 2, delta: 6 }]);
    t.deepEqual(d.headers(), ['1990_2', '1990_8', '1991_2', '1991_8', '1992_2', '1992_8'], "Bi-annual range");
    t.deepEqual(d.headerHTML(), ['1990', '1990', '1991', '1991', '1992', '1992'], "Start month forced, so don't care about month");
    t.deepEqual(d.parameterHtml(), [
        '<span><label><span lang="en">Years</span>: ',
        '<input type="number" name="min" min="1900" max="2050" step="1" value="1990" />',
        '…',
        '<input type="number" name="max" min="1900" max="2050" step="1" value="1992" />',
        '</label>&nbsp;',
        '<select name="delta">',
        '<option value="12" lang="en">Yearly</option>',
        '<option value="6" selected="selected" lang="en">Bi-annual</option>',
        '<option value="3" lang="en">Quarterly</option>',
        '<option value="1" lang="en">Monthly</option>',
        '</select>',
        '</span>',
    ].join("\n"), "Switched to bi-annual, forced start at 2");

    t.throws(function () {
        d = new Dimension([{ type: 'timeseries', min: 1990, max: 1992, start_month: 4, delta: 3 }]);
    }, "Start month", "Noticed start month is bigger than delta");

    d = new Dimension([{ type: 'timeseries', min: 1990, max: 1992, delta: 6, allowed_periods: ['yearly', 'bi-annual'] }]);
    t.deepEqual(d.parameterHtml(), [
        '<span><label><span lang="en">Years</span>: ',
        '<input type="number" name="min" min="1900" max="2050" step="1" value="1990" />',
        '…',
        '<input type="number" name="max" min="1900" max="2050" step="1" value="1992" />',
        '</label>&nbsp;',
        '<select name="delta">',
        '<option value="12" lang="en">Yearly</option>',
        '<option value="6" selected="selected" lang="en">Bi-annual</option>',
        '</select>',
        '<label><span lang="en">Start Month</span>: ',
        '<input type="number" name="start_month" min="1" max="12" step="1" value="1" />',
        '</label>&nbsp;</span>',
    ].join("\n"), "Allowed periods restricts select box");

    d = new Dimension([{ type: 'timeseries', min: 1990, max: 1992, delta: 12, allowed_periods: ['yearly'] }]);
    t.deepEqual(d.parameterHtml(), [
        '<span><label><span lang="en">Years</span>: ',
        '<input type="number" name="min" min="1900" max="2050" step="1" value="1990" />',
        '…',
        '<input type="number" name="max" min="1900" max="2050" step="1" value="1992" />',
        '</label>&nbsp;',
        '',
        '<label><span lang="en">Start Month</span>: ',
        '<input type="number" name="start_month" min="1" max="12" step="1" value="1" />',
        '</label>&nbsp;</span>',
    ].join("\n"), "Only one allowed period gets rid of select box");

    d = new Dimension([{ type: 'timeseries', prefix: "pre_" }]);
    t.deepEqual(d.headers(), sequence(2000, 2010).map(function (x) { return "pre_" + x + "_1"; }), "Headers get prefix");
    t.deepEqual(d.headerHTML(), sequence(2000, 2010).map(function (x) { return "<span>pre_</span>" + x + " 1"; }), "Titles get prefix");

    d = new Dimension([{ type: 'timeseries', prefix: { name: "pre_", title: "Pre " }}]);
    t.deepEqual(d.headers(), sequence(2000, 2010).map(function (x) { return "pre_" + x + "_1"; }), "Headers get prefix");
    t.deepEqual(d.headerHTML(), sequence(2000, 2010).map(function (x) { return "<span>Pre </span>" + x + " 1"; }), "Titles get different prefix");

    t.end();
});

test('TimeSeriesDimension:update_init', function (t) {
    var d;

    function dim_settings(x, idx) {
        return [
            x.dims[idx || 0].min,
            x.dims[idx || 0].max,
            x.dims[idx || 0].start_month,
            x.dims[idx || 0].delta,
        ];
    }

    d = new Dimension([{ type: 'timeseries', min: 2000, max: 2002 }]);
    t.deepEqual(d.headers(), ['2000_1', '2001_1', '2002_1'], "Set to 2000..2002");
    t.deepEqual(dim_settings(d), [2000, 2002, 1, 12], "Set to 2000..2002 / yearly");

    d.update_init([]);
    t.deepEqual(dim_settings(d), [2000, 2002, 1, 12], "Set to 2000..2002 (empty update_init does nothing)");

    d.update_init(['1996', '1997', '1998']);
    t.deepEqual(dim_settings(d), [1996, 1998, 1, 12], "Set to 1996..1998 (default to year if missing)");

    d.update_init(['1996_3', '1996_9', '1997_3', '1997_9', '1998_3', '1998_9']);
    t.deepEqual(dim_settings(d), [1996, 1998, 3, 6], "Set to 1996..1998 bi-annual, start 3");

    d.update_init(['1996_3', '1997_3', '1997_9', '1998_3', '1998_9']);
    t.deepEqual(dim_settings(d), [1996, 1998, 3, 6], "Missing entry didn't affect finding the smallest delta");

    t.throws(function () {
        d.update_init(['1997_1', '1997_6']);
    }, "5", "Wonky delta noticed");

    d = new Dimension([
        { type: 'timeseries', min: 2000, max: 2002 },
        { name: 'parrot' },
        { type: 'timeseries', min: 2000, max: 2002 },
    ]);
    d.update_init(['1996', '1997', '1998', 'parrot', '1999']);
    t.deepEqual(dim_settings(d, 0), [1996, 1998, 1, 12], "Set to 1996..1998, ignored everything after parrot");
    t.deepEqual(dim_settings(d, 2), [1999, 1999, 1, 12], "Second dimension got 1999");

    t.end();
});


test('TimeSeriesDimension:update', function (t) {
    var d, fp;

    function new_fp(min, max, start_month, delta) {
        return new FakeParams([
            { name: 'min', value: min.toString(), min: 0 },
            { name: 'max', value: max.toString(), min: 0 },
            { name: 'delta', options: [{selected: true, value: delta.toString()}] },
            { name: 'start_month', value: start_month.toString(), min: 1 },
        ]);
    }
    function dim_settings(x, idx) {
        return [
            x.dims[idx || 0].min,
            x.dims[idx || 0].max,
            x.dims[idx || 0].start_month,
            x.dims[idx || 0].delta,
        ];
    }

    d = new Dimension([{ type: 'timeseries', min: 2000, max: 2002 }]);
    t.deepEqual(d.headers(), ['2000_1', '2001_1', '2002_1'], "Set to 2000..2002");
    t.deepEqual(dim_settings(d), [2000, 2002, 1, 12], "Set to 2000..2002 / yearly");

    fp = new_fp(2000, 2004, 1, 12);
    t.deepEqual(d.update(fp, fp.target(0, 'max')), [
        { name: 'insert', idx: 3, count: 2 }
    ], "Add 2 years to end");

    fp = new_fp(2001, 2004, 1, 12);
    t.deepEqual(d.update(fp, fp.target(0, 'min')), [
        { name: 'remove', idx: 0, count: 1 }
    ], "Remove 1 year from start");

    fp = new_fp(2005, 2004, 1, 12);
    t.deepEqual(d.update(fp, fp.target(0, 'min')), [
        { name: 'remove', idx: 0, count: 4 },
        { name: 'insert', idx: 0, count: 1 }
    ], "Shunt everything up to match new min");
    t.deepEqual(dim_settings(d), [2005, 2005, 1, 12], "Max has been adjusted to match min");

    fp = new_fp(2005, 2004, 1, 12);
    t.deepEqual(d.update(fp, fp.target(0, 'max')), [
        { name: 'insert', idx: 0, count: 1 },
        { name: 'remove', idx: 1, count: 1 },
    ], "Shunt back down to match max");
    t.deepEqual(dim_settings(d), [2004, 2004, 1, 12], "Min has been adjusted to match max");

    fp = new_fp(2004, 2004, 24, 12);
    t.deepEqual(d.update(fp, fp.target(0, 'start_month')), [
    ], "Changing start month doesn't add any cols");
    t.deepEqual(dim_settings(d), [2004, 2004, 12, 12], "Start month can't be set over the delta");

    fp = new_fp(2004, 2004, 6, 12);
    t.deepEqual(d.update(fp, fp.target(0, 'start_month')), [
    ], "Can be set to mid-year");
    t.deepEqual(dim_settings(d), [2004, 2004, 6, 12], "Can be set to mid-year");

    d = new Dimension([{ type: 'timeseries', min: 2000, max: 2002 }]);
    t.deepEqual(dim_settings(d), [2000, 2002, 1, 12], "(re)set to 2000..2002 / yearly");

    fp = new_fp(2000, 2002, 1, 6);
    t.deepEqual(d.update(fp, fp.target(0, 'delta')), [
        { name: 'insert', idx: 3, count: 1 },
        { name: 'insert', idx: 2, count: 1 },
        { name: 'insert', idx: 1, count: 1 },
    ], "Bi-annual adds an entry for each year");
    t.deepEqual(dim_settings(d), [2000, 2002, 1, 6], "Bi-annual");

    fp = new_fp(2000, 2002, 8, 6);
    t.deepEqual(d.update(fp, fp.target(0, 'start_month')), [
    ], "Changing start month doesn't add any cols");
    t.deepEqual(dim_settings(d), [2000, 2002, 6, 6], "Bi-annual can't be set over delta");

    fp = new_fp(2000, 2002, 6, 3);
    t.deepEqual(d.update(fp, fp.target(0, 'delta')), [
        { name: 'insert', idx: 6, count: 2 },
        { name: 'insert', idx: 4, count: 2 },
        { name: 'insert', idx: 2, count: 2 },
    ], "Quarterly adds 2 entries for each year");
    t.deepEqual(dim_settings(d), [2000, 2002, 3, 3], "Start month reduces accordingly");

    fp = new_fp(2000, 2002, 3, 12);
    t.deepEqual(d.update(fp, fp.target(0, 'delta')), [
        { name: 'remove', idx: 9, count: 3 },
        { name: 'remove', idx: 5, count: 3 },
        { name: 'remove', idx: 1, count: 3 },
    ], "Back to yearly removes 3 entries for each year");
    t.deepEqual(dim_settings(d), [2000, 2002, 3, 12], "Back to yearly");

    d = new Dimension([{ type: 'timeseries', min: 2000, max: 2002, start_month: 1 }]);
    fp = new FakeParams([
        { name: 'min', value: "2000", min: 0 },
        { name: 'max', value: "2004", min: 0 },
        { name: 'delta', options: [{selected: true, value: "12"}] },
    ]);
    t.deepEqual(d.update(fp, fp.target(0, 'max')), [
        { name: 'insert', idx: 3, count: 2 }
    ], "Still works when start_month not available");

    d = new Dimension([{ type: 'timeseries', min: 2000, max: 2002, allowed_periods: ['yearly'] }]);
    fp = new FakeParams([
        { name: 'min', value: "2000", min: 0 },
        { name: 'max', value: "2004", min: 0 },
        { name: 'start_month', value: "1", min: 1 },
    ]);
    t.deepEqual(d.update(fp, fp.target(0, 'max')), [
        { name: 'insert', idx: 3, count: 2 }
    ], "Still works when delta not available");

    t.end();
});
