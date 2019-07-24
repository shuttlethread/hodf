"use strict";
/*jslint todo: true, regexp: true, browser: true, unparam: true, plusplus: true */
/*global Promise */
var hodf_utils = require('./hodf_utils.js');

function sequence(min, max) {
    var i, out = [];

    if (min > max) {
        throw new Error("Minimum (" + min + ") should be smaller than maximum (" + max + ")");
    }

    for (i = min; i <= max; i++) {
        out.push(i.toString());
    }

    return out;
}

function to_hot_properties(prop) {
    if (!prop.content) {
        return {};
    }
    if (Array.isArray(prop.content)) {
        return {type: 'dropdown', source: prop.content};
    }
    if (typeof prop.content === 'string') {
        return {type: prop.content, allowInvalid: false};
    }
    // Allow unrecognised objects to pass through
    return prop.content;
}

function ListDimension(t, init_headings, lang) { this.values = t.values; this.lang = lang; }
ListDimension.prototype.parameterHtml = function () { return ""; };
ListDimension.prototype.headers = function () { return this.values.map(function (x) { return x.name; }); };
ListDimension.prototype.headerHTML = function () { return this.values.map(function (x) { return hodf_utils.tlate(x.title, 'span', this.lang) || x.name; }.bind(this)); };
ListDimension.prototype.minCount = function () { return this.values.length; };
ListDimension.prototype.maxCount = function () { return this.values.length; };
ListDimension.prototype.dataProperties = function () { return this.values.map(to_hot_properties); };

function RangeDimension(t, init_headings, lang) {
    var numeric_headings;

    this.initial = t.initial || [];
    this.overall_min = t.overall_min || 1;
    this.overall_max = t.overall_max || 100;
    this.prefix = t.prefix || {name: '', title: ''};
    this.content = t.content;
    this.lang = lang;

    // Try to work out numeric headings based on init_headings inputs
    numeric_headings = (init_headings || []).map(function (x) {
        if (this.prefix.name && x.indexOf(this.prefix.name) === 0) {
            x = x.substr(this.prefix.name.length);
        }

        return Number(x);
    }.bind(this)).filter(function (x) { return !isNaN(x); });

    // If we didn't get any, just use min/max
    if (numeric_headings.length === 0) {
        numeric_headings = [t.min, t.max];
    }

    this.min = Math.min.apply(null, numeric_headings);
    this.max = Math.max.apply(null, numeric_headings);
}
RangeDimension.prototype.parameterHtml = function () {
    return [
        '<label>Min: <input type="number" name="min" min="' + this.overall_min + '" max="' + this.overall_max + '" step="1" value="' + this.min + '" /></label>',
        '<label>Max: <input type="number" name="max" min="' + this.overall_min + '" max="' + this.overall_max + '" step="1" value="' + this.max + '" /></label>',
    ].join("\n");
};
RangeDimension.prototype.headers = function () {
    return this.initial.map(function (x) { return x.name; }).concat(
        sequence(this.min, this.max).map(function (x) { return this.prefix.name + x; }.bind(this))
    );
};
RangeDimension.prototype.headerHTML = function () {
    return this.initial.map(function (x) { return (hodf_utils.tlate(x.title, 'span', this.lang) || x.name); }.bind(this)).concat(
        sequence(this.min, this.max).map(function (x) { return (this.prefix.title || this.prefix.name) + x; }.bind(this))
    );
};
RangeDimension.prototype.minCount = function () { return this.initial.length + this.max - this.min + 1; };
RangeDimension.prototype.maxCount = function () { return this.initial.length + this.max - this.min + 1; };
RangeDimension.prototype.dataProperties = function () {
    return this.initial.map(to_hot_properties).concat(
        sequence(this.min, this.max).map(function (x) { return to_hot_properties(this); }.bind(this))
    );
};
RangeDimension.prototype.update = function (paramEl, hot, e) {
    var i, oldHeaders, newHeaders, self = this,
        startEl = paramEl.querySelector("input[name=min]"),
        endEl = paramEl.querySelector("input[name=max]");

    function to_num(x, offset) {
        return parseInt(x.substr((self.prefix.title || self.prefix.name).length), 10) + (offset || 0);
    }

    // make sure other end of range is configured appropriately
    if (e.target.id === startEl.id) {
        endEl.min = startEl.value;
        if (endEl.value < endEl.min) {
            endEl.value = endEl.min;
        }
    } else if (e.target.id === endEl.id) {
        startEl.max = endEl.value;
        if (startEl.value > startEl.max) {
            startEl.value = startEl.max;
        }
    }
    this.min = parseInt(startEl.value, 10);
    this.max = parseInt(endEl.value, 10);

    // Work out which headers are missing
    newHeaders = this.headers();
    oldHeaders = [].concat(hot.getColHeader());  // NB: Clone so we don't inadvertantly alter internals

    // Add/remove items to bottom until they line up
    hot.updateSettings({
        minCols: this.initial.length,
        maxCols: newHeaders.length,
    });
    for (i = 0; i < 2000; i++) {
        if (to_num(oldHeaders[this.initial.length]) > to_num(newHeaders[this.initial.length])) {
            // Bottom is higher than we need, add one smaller
            oldHeaders.splice(this.prefix.title + this.initial.length, 0, to_num(oldHeaders[this.initial.length], -1).toString());
            hot.alter('insert_col', this.initial.length);
        } else if (to_num(oldHeaders[this.initial.length]) < to_num(newHeaders[this.initial.length])) {
            // Bottom is smaller than we need, remove one
            oldHeaders.splice(this.initial.length, 1);
            hot.alter('remove_col', this.initial.length);
        } else if (to_num(oldHeaders[oldHeaders.length - 1]) < to_num(newHeaders[newHeaders.length - 1])) {
            // Top is smaller than we need, add one
            oldHeaders.push(this.prefix.title + to_num(oldHeaders[oldHeaders.length - 1], 1).toString());
            hot.alter('insert_col', oldHeaders.length);
        } else if (to_num(oldHeaders[oldHeaders.length - 1]) > to_num(newHeaders[newHeaders.length - 1])) {
            // Top is bigger than we need, remove one
            oldHeaders.pop();
            hot.alter('remove_col', oldHeaders.length);
        } else {
            // We're done
            break;
        }

        if (i > 1000) {
            throw new Error("Adding too many rows");
        }
    }

    hot.updateSettings({
        colHeaders: oldHeaders,
    });
};

// YearDimension inherits RangeDimension
function YearDimension(t, init_headings, lang) {
    RangeDimension.apply(this, arguments);

    this.overall_min = t.overall_min || 1900;
    this.overall_max = t.overall_max || 2050;
}
YearDimension.prototype = Object.create(RangeDimension.prototype);
YearDimension.prototype.parameterHtml = function () {
    var titles = {
        "start": { "en": "Start year", "es": "Año de inicio" },
        "end": "End year",
    };

    return [
        '<label>' + hodf_utils.tlate(titles.start, 'span', this.lang) + ': <input type="number" name="min" min="' + this.overall_min + '" max="' + this.overall_max + '" step="1" value="' + this.min + '" /></label>',
        '<label>' + hodf_utils.tlate(titles.end, 'span', this.lang) + ': <input type="number" name="max" min="' + this.overall_min + '" max="' + this.overall_max + '" step="1" value="' + this.max + '" /></label>',
    ].join("\n");
};

// BinsDimension inherits RangeDimension
function BinsDimension(t, init_headings, lang) {
    t.min = 1;
    RangeDimension.apply(this, [t, init_headings]);

    this.overall_min = t.overall_min || 1;
    this.overall_max = t.overall_max || 1000;
}
BinsDimension.prototype = Object.create(RangeDimension.prototype);
BinsDimension.prototype.parameterHtml = function () {
    return [
        '<input type="hidden" name="min" value="' + this.min + '" />',
        '<label>' + (this.prefix.title ? this.prefix.title + 'Max' : 'Bins') + ': <input type="number" name="max" min="' + this.overall_min + '" max="' + this.overall_max + '" step="1" value="' + this.max + '" /></label>',
    ].join("\n");
};

/** Get a new dimension based on type */
function get_dimension(t, init_headings, lang) {
    if (Array.isArray(t)) {
        return new ListDimension({values: t}, init_headings, lang);
    }

    return new ({
        list: ListDimension,
        year: YearDimension,
        bins: BinsDimension,
    }[t.type])(t, init_headings, lang);
}
module.exports.get_dimension = get_dimension;
