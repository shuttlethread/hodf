"use strict";
/*jslint todo: true, regexp: true, browser: true, unparam: true, plusplus: true */
/*global Promise */
var hodf_utils = require('./hodf_utils.js');
var sequence = require('./sequence.js').sequence;


/** Range dimension: A set of values x..y
 **/
function RangeDimension(t) {
    this.overall_min = t.overall_min || 1;
    this.overall_max = t.overall_max || 100;
    this.min = t.min || this.overall_min;
    this.max = t.max || this.overall_max;
    this.prefix = t.prefix || '';
    if (!this.prefix.hasOwnProperty('name')) {
        this.prefix = {name: this.prefix, title: this.prefix};
    }
    if (!this.prefix.title) {
        this.prefix.title = this.prefix.name;
    }
    this.parameter_title = t.parameter_title || this.prefix.title || 'Range';
    this.content = t.content;
}
RangeDimension.prototype.parameterHtml = function (lang) {
    return [
        '<label>' + hodf_utils.tlate(this.parameter_title, 'span', lang) + ': ',
        '<input type="number" name="min" min="' + this.overall_min + '" max="' + this.overall_max + '" step="1" value="' + this.min + '" />',
        '…',
        '<input type="number" name="max" min="' + this.overall_min + '" max="' + this.overall_max + '" step="1" value="' + this.max + '" />',
        '</label>&nbsp;',
    ].join("\n");
};
RangeDimension.prototype.headers = function () {
    return sequence(this.min, this.max).map(function (x) { return this.prefix.name + x; }.bind(this));
};
RangeDimension.prototype.headerHTML = function (lang) {
    return sequence(this.min, this.max).map(function (x) { return hodf_utils.tlate(this.prefix.title, 'span', lang) + x; }.bind(this));
};
RangeDimension.prototype.dataProperties = function () {
    return sequence(this.min, this.max).map(function (x) { return hodf_utils.to_hot_properties(this); }.bind(this));
};
RangeDimension.prototype.update_init = function (init_headings) {
    var i, m, idx = null, prev_idx = null;
    // TODO: Should we skip over unknown entities?

    // Find 0..i range of headings we can consume
    for (i = 0; i < init_headings.length; i++) {
        m = init_headings[i].match('^' + this.prefix.name + '(\\d+)$');

        if (m === null) {
            // Missing prefix / not-a-number
            break;
        }

        idx = parseInt(m[1], 10);
        if (prev_idx !== null && prev_idx + 1 !== idx) {
            // We're not monotonically increasing, bail-out
            break;
        }

        // Valid value, set min/max
        if (i === 0) {
            this.min = idx;
        }
        this.max = idx;

        prev_idx = idx;
    }

    if (i > 0) {
        init_headings.splice(0, i);
    }
};
RangeDimension.prototype.update = function (param_el, target_el) {
    var out = [],
        prev_min = this.min,
        prev_max = this.max,
        start_el = param_el.querySelector("input[name=min]"),
        end_el = param_el.querySelector("input[name=max]");

    this.min = parseInt(start_el.value, 10);
    this.max = parseInt(end_el.value, 10);

    // Make sure min < max by nudging the control the user didn't touch.
    if (target_el === start_el) {
        if (this.max < this.min) {
            end_el.value = start_el.value;
            this.max = this.min;
        }
    } else if (target_el === end_el) {
        if (this.min > this.max) {
            start_el.value = end_el.value;
            this.min = this.max;
        }
    }

    if (this.min > prev_min) {
        out.push({
            name: 'remove',
            idx: 0,
            count: this.min - prev_min,
        });
    } else if (this.min < prev_min) {
        out.push({
            name: 'insert',
            idx: 0,
            count: prev_min - this.min,
        });
    }

    if (this.max > prev_max) {
        out.push({
            name: 'insert',
            //       (prev length)       (delta from min ops.)
            idx: (prev_max - prev_min) - (this.min - prev_min) + 1,
            count: this.max - prev_max,
        });
    } else if (this.max < prev_max) {
        out.push({
            name: 'remove',
            //       (prev length)       (delta from min ops.)    (start of removals)
            idx: (prev_max - prev_min) - (this.min - prev_min) - (prev_max - this.max) + 1,
            count: prev_max - this.max,
        });
    }

    return out;
};
module.exports.RangeDimension = RangeDimension;

// YearDimension inherits RangeDimension
function YearDimension(t) {
    t.overall_min = t.overall_min || 1900;
    t.overall_max = t.overall_max || 2050;
    t.parameter_title = t.parameter_title || { "en": "Years", "es": "Años" };

    RangeDimension.call(this, t);
}
YearDimension.prototype = Object.create(RangeDimension.prototype);
module.exports.YearDimension = YearDimension;

// BinsDimension inherits RangeDimension
function BinsDimension(t) {
    t.min = 1;
    t.overall_min = t.overall_min || 1;
    t.overall_max = t.overall_max || 1000;
    t.parameter_title = t.prefix ? (t.prefix.title || t.prefix) : 'Bin ';
    this.total_title = t.total_title || 'Total';

    RangeDimension.call(this, t);
}
BinsDimension.prototype = Object.create(RangeDimension.prototype);
BinsDimension.prototype.parameterHtml = function (lang) {
    return [
        '<label>' + hodf_utils.tlate(this.parameter_title, 'span', lang) + hodf_utils.tlate(this.total_title, 'span', lang) + ': ',
        '<input type="hidden" name="min" value="' + this.min + '" />',
        '<input type="number" name="max" min="' + this.overall_min + '" max="' + this.overall_max + '" step="1" value="' + this.max + '" />',
        '</label>&nbsp;',
    ].join("\n");
};
module.exports.BinsDimension = BinsDimension;
