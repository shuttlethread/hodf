"use strict";
/*jslint todo: true, regexp: true, browser: true, unparam: true, plusplus: true */
/*global Promise */
var hodf_utils = require('./hodf_utils.js');
var sequence = require('./sequence.js').sequence;

var period_defs = {
    'yearly': { periods: [1], title: { en: 'Yearly', es: 'Anual' } },
    'bi-annual': { periods: [1, 7], title: { en: 'Bi-annual', es: 'Semestral' } },
    'quarterly': { periods: [1, 4, 7, 10], title: { en: 'Quarterly', es: 'Trimestral' } },
    'monthly': { periods: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], title: { en: 'Monthly', es: 'Mensual' } },
};


/** TimeSeries dimension: A set of values x..y
 **/
function TimeSeriesDimension(t) {
    this.overall_min = t.overall_min || 1900;
    this.overall_max = t.overall_max || 2050;
    this.min = t.min || this.overall_min;
    this.max = t.max || this.overall_max;
    this.prefix = t.prefix || '';

    // Turn allowed_periods name into it's definition
    this.allowed_periods = (t.allowed_periods || '*') === '*' ? Object.keys(period_defs) : t.allowed_periods;
    this.allowed_periods = this.allowed_periods.map(function (k) { return period_defs[k]; });
    this.period = t.period || this.allowed_periods[0].periods;

    if (!this.prefix.hasOwnProperty('name')) {
        this.prefix = {name: this.prefix, title: this.prefix};
    }
    if (!this.prefix.title) {
        this.prefix.title = this.prefix.name;
    }
    this.parameter_title = t.parameter_title || this.prefix.title || { "en": "Years", "es": "Años" };
    this.content = t.content;
}
TimeSeriesDimension.prototype.parameterHtml = function (lang) {
    return [
        '<label>' + hodf_utils.tlate(this.parameter_title, 'span', lang) + ': ',
        '<input type="number" name="min" min="' + this.overall_min + '" max="' + this.overall_max + '" step="1" value="' + this.min + '" />',
        '…',
        '<input type="number" name="max" min="' + this.overall_min + '" max="' + this.overall_max + '" step="1" value="' + this.max + '" />',
        '<select name="period">',
        this.allowed_periods.map(function (p) {
            return '<option' +
                ' value="' + p.periods.join("_") + '"' +
                (p.periods.join("_") === this.period.join("_") ? ' selected="selected"' : '') +
                '>' + hodf_utils.tlate(p.title, 'span', lang) + '</option>';
        }.bind(this)).join("\n"),
        '</select>',
        '</label>&nbsp;',
    ].join("\n");
};
TimeSeriesDimension.prototype.headers = function () {
    return sequence(this.min, this.max).reduce(function (acc, year) {
        if (this.period.length === 1) {
            // Yearly doesn't need a postfix
            return acc.concat([this.prefix.name + year]);
        }
        return acc.concat(this.period.map(function (p) {
            return this.prefix.name + year + '_' + p;
        }.bind(this)));
    }.bind(this), []);
};
TimeSeriesDimension.prototype.headerHTML = function (lang) {
    return sequence(this.min, this.max).reduce(function (acc, year) {
        if (this.period.length === 1) {
            // Yearly doesn't need a postfix
            return acc.concat([hodf_utils.tlate(this.prefix.title, 'span', lang) + year]);
        }

        return acc.concat(this.period.map(function (p, i) {
            return hodf_utils.tlate(this.prefix.title, 'span', lang) + year + ' ' + p + "–" + ((this.period[i + 1] || 13) - 1);
        }.bind(this)));
    }.bind(this), []);
};
TimeSeriesDimension.prototype.dataProperties = function () {
    return sequence(this.min, this.max).reduce(function (acc, year) {
        return acc.concat(this.period.map(function (p) {
            return hodf_utils.to_hot_properties(this);
        }.bind(this)));
    }.bind(this), []);
};
TimeSeriesDimension.prototype.update_init = function (init_headings) {
    var i, m, x, year = null, prev_year = null, period = [];

    // Find 0..i TimeSeries of headings we can consume
    for (i = 0; i < init_headings.length; i++) {
        m = init_headings[i].match('^' + this.prefix.name + '(\\d+)_?([qm0-9]*)$');

        if (m === null) {
            // Missing prefix / not-a-number
            break;
        }

        year = parseInt(m[1], 10);

        if (prev_year !== null && prev_year !== year && prev_year + 1 !== year) {
            // We're not monotonically increasing, bail-out
            break;
        }

        // Valid value, set min/max
        if (i === 0) {
            this.min = year;
        }
        this.max = year;

        // Add current period to the list
        x = parseInt(m[2] || period_defs.yearly.periods[0], 10);
        if (period.length === 0 || x > period[period.length - 1]) {
            period.push(x);
        }

        prev_year = year;
    }

    if (i > 0) {
        init_headings.splice(0, i);
        this.period = period;
    }
};
TimeSeriesDimension.prototype.update = function (param_el, target_el) {
    var out = [],
        year,
        prev_min = this.min,
        prev_max = this.max,
        prev_pd = this.period,
        start_el = param_el.querySelector("input[name=min]"),
        end_el = param_el.querySelector("input[name=max]"),
        period_el = param_el.querySelector("select[name=period]");

    this.min = parseInt(start_el.value, 10);
    this.max = parseInt(end_el.value, 10);
    this.period = Array.prototype.find.call(period_el.options, function (o) { return o.selected; }).value.split("_");

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
            count: (this.min - prev_min) * prev_pd.length,
        });
    } else if (this.min < prev_min) {
        out.push({
            name: 'insert',
            idx: 0,
            count: (prev_min - this.min) * prev_pd.length,
        });
    }

    if (this.max > prev_max) {
        out.push({
            name: 'insert',
            //       (prev length)       (delta from min ops.)
            idx: ((prev_max - prev_min) - (this.min - prev_min) + 1) * prev_pd.length,
            count: (this.max - prev_max) * prev_pd.length,
        });
    } else if (this.max < prev_max) {
        out.push({
            name: 'remove',
            //       (prev length)       (delta from min ops.)    (start of removals)
            idx: ((prev_max - prev_min) - (this.min - prev_min) - (prev_max - this.max) + 1) * prev_pd.length,
            count: (prev_max - this.max) * prev_pd.length,
        });
    }

    // If period count doesn't match, add/remove items for each year at start
    if (this.period.length > prev_pd.length) {
        for (year = this.max - this.min; year >= 0; year--) {
            out.push({
                name: 'insert',
                idx: prev_pd.length * year,
                count: this.period.length - prev_pd.length,
            });
        }
    } else if (this.period.length < prev_pd.length) {
        for (year = this.max - this.min; year >= 0; year--) {
            out.push({
                name: 'remove',
                idx: (prev_pd.length * year),
                count: prev_pd.length - this.period.length,
            });
        }
    }

    return out;
};
module.exports = TimeSeriesDimension;
