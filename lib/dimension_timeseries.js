"use strict";
/*jslint todo: true, regexp: true, browser: true, unparam: true, plusplus: true */
/*global Promise */
var hodf_utils = require('./hodf_utils.js');
var sequence = require('./sequence.js').sequence;

var period_defs = {
    'yearly': { delta: 12, title: { en: 'Yearly', es: 'Anual' } },
    'bi-annual': { delta: 6, title: { en: 'Bi-annual', es: 'Semestral' } },
    'quarterly': { delta: 3, title: { en: 'Quarterly', es: 'Trimestral' } },
    'monthly': { delta: 1, title: { en: 'Monthly', es: 'Mensual' } },
};


function month_sequence(y_min, y_max, m_start, m_delta) {
    var year = y_min, month = m_start, out = [];

    while (year <= y_max) {
        out.push({ year: year, month: month });

        month += m_delta;
        if (month > 12) {
            year += 1;
            month -= 12;
        }
    }
    return out;
}


/** TimeSeries dimension: A set of values x..y
 **/
function TimeSeriesDimension(t) {
    this.overall_min = t.overall_min || 1900;
    this.overall_max = t.overall_max || 2050;
    this.min = Math.max(this.overall_min, t.min || 2000);
    this.max = Math.min(this.overall_max, t.max || 2010);
    this.prefix = t.prefix || '';

    // Turn allowed_periods name into it's definition
    this.allowed_periods = (t.allowed_periods || '*') === '*' ? Object.keys(period_defs) : t.allowed_periods;
    this.allowed_periods = this.allowed_periods.map(function (k) { return period_defs[k]; });
    this.delta = t.delta || this.allowed_periods[0].delta;
    this.start_month = t.start_month || 1;
    this.customise_start_month = !t.start_month;

    if (this.start_month > this.delta) {
        throw new Error("Start month should not be bigger than delta");
    }

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
        '</label>&nbsp;',
        '<select name="delta">',
        this.allowed_periods.map(function (p) {
            return hodf_utils.tlate(p.title, 'option', lang).replace(/^<option /, "<option" +
                ' value="' + p.delta + '"' +
                (p.delta === this.delta ? ' selected="selected"' : '') +
                " ");
        }.bind(this)).join("\n"),
        '</select>',
        this.customise_start_month ? (
            '<label>' + hodf_utils.tlate({en: 'Start Month'}, 'span', lang) + ': \n' +
            '<input type="number" name="start_month" min="1" max="12" step="1" value="' + this.start_month + '" />\n' +
            '</label>&nbsp;'
        ) : '',
    ].join("\n");
};
TimeSeriesDimension.prototype.headers = function () {
    return month_sequence(this.min, this.max, this.start_month, this.delta).map(function (m) {
        return this.prefix.name + m.year + '_' + m.month;
    }.bind(this));
};
TimeSeriesDimension.prototype.headerHTML = function (lang) {
    return month_sequence(this.min, this.max, this.start_month, this.delta).map(function (m) {
        return hodf_utils.tlate(this.prefix.title, 'span', lang) + m.year + (this.customise_start_month ? ' ' + m.month : '');
    }.bind(this));
};
TimeSeriesDimension.prototype.dataProperties = function () {
    return month_sequence(this.min, this.max, this.start_month, this.delta).map(function (m) {
        return hodf_utils.to_hot_properties(this);
    }.bind(this));
};
TimeSeriesDimension.prototype.update_init = function (init_headings) {
    var i, m, year, month, prev_year = null, prev_month = null;

    // Find 0..i TimeSeries of headings we can consume
    for (i = 0; i < init_headings.length; i++) {
        // NB: _(month) isn't strictly speaking optional, but needed for backwards compatibility
        m = init_headings[i].match('^' + this.prefix.name + '(\\d+)_?([0-9]*)$');

        if (m === null) {
            // Missing prefix / not-a-number
            break;
        }

        year = parseInt(m[1], 10);
        month = parseInt(m[2], 10) || 1;

        if (prev_year === null) {
            // First entry, assume we have a yearly delta for now
            this.min = year;
            this.start_month = month;
            this.delta = 12;
        }
        this.max = year;

        // If still in the same month, check delta
        if (prev_month !== null && year === prev_year && (this.delta > month - prev_month)) {
            this.delta = month - prev_month;
        }

        prev_year = year;
        prev_month = month;
    }

    if (i > 0) {
        init_headings.splice(0, i);

        if (this.allowed_periods.filter(function (p) { return p.delta === this.delta; }.bind(this)).length === 0) {
            throw new Error("Unknown delta between months: " + this.delta);
        }
    }
};
TimeSeriesDimension.prototype.update = function (param_el, target_el) {
    var out = [],
        year,
        months,
        prev_min = this.min,
        prev_max = this.max,
        prev_months = 12 / this.delta,
        start_el = param_el.querySelector("input[name=min]"),
        end_el = param_el.querySelector("input[name=max]"),
        delta_el = param_el.querySelector("select[name=delta]"),
        start_month_el = param_el.querySelector("input[name=start_month]") || { value: this.start_month, max: this.start_month };

    this.min = parseInt(start_el.value, 10);
    this.max = parseInt(end_el.value, 10);
    this.start_month = parseInt(start_month_el.value, 10);
    this.delta = parseInt(Array.prototype.find.call(delta_el.options, function (o) { return o.selected; }).value, 10);
    months = 12 / this.delta;

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

    // Keep start_month low enough so we get whole years
    if (this.start_month > this.delta) {
        start_month_el.value = this.delta;
        this.start_month = this.delta;
    }
    start_month_el.max = this.delta;

    if (this.min > prev_min) {
        out.push({
            name: 'remove',
            idx: 0,
            count: (this.min - prev_min) * prev_months,
        });
    } else if (this.min < prev_min) {
        out.push({
            name: 'insert',
            idx: 0,
            count: (prev_min - this.min) * prev_months,
        });
    }

    if (this.max > prev_max) {
        out.push({
            name: 'insert',
            //       (prev length)       (delta from min ops.)
            idx: ((prev_max - prev_min) - (this.min - prev_min) + 1) * prev_months,
            count: (this.max - prev_max) * prev_months,
        });
    } else if (this.max < prev_max) {
        out.push({
            name: 'remove',
            //       (prev length)       (delta from min ops.)    (start of removals)
            idx: ((prev_max - prev_min) - (this.min - prev_min) - (prev_max - this.max) + 1) * prev_months,
            count: (prev_max - this.max) * prev_months,
        });
    }

    // If month count doesn't match, add/remove items for each year at start
    if (months > prev_months) {
        for (year = this.max - this.min + 1; year > 0; year--) {
            out.push({
                name: 'insert',
                idx: prev_months * year,
                count: months - prev_months,
            });
        }
    } else if (months < prev_months) {
        for (year = this.max - this.min; year >= 0; year--) {
            out.push({
                name: 'remove',
                idx: (prev_months * year) + months,
                count: prev_months - months,
            });
        }
    }

    return out;
};
module.exports = TimeSeriesDimension;
