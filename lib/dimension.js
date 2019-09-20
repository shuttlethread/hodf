"use strict";
/*jslint todo: true, regexp: true, browser: true, unparam: true, plusplus: true */
/*global Promise */
var hodf_utils = require('./hodf_utils.js');
var sequence = require('./sequence.js').sequence;

var dim_registry = {};

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

function Dimension(t) {
    this.dims = (Array.isArray(t) ? t : [t]).map(function (sub_t) {
        return new (dim_registry[sub_t.type || 'static'])(sub_t);
    });
}
Dimension.prototype.parameterHtml = function (lang) {
    return this.dims.map(function (sub_dim) {
        return '<span>' + sub_dim.parameterHtml(lang) + '</span>';
    }).join("");
};
Dimension.prototype.headers = function () {
    return this.dims.reduce(function (acc, sub_dim) {
        acc.push.apply(acc, sub_dim.headers());
        return acc;
    }, []);
};
Dimension.prototype.headerHTML = function (lang) {
    return this.dims.reduce(function (acc, sub_dim) {
        acc.push.apply(acc, sub_dim.headerHTML(lang));
        return acc;
    }, []);
};
Dimension.prototype.dataProperties = function () {
    return this.dims.reduce(function (acc, sub_dim) {
        acc.push.apply(acc, sub_dim.dataProperties());
        return acc;
    }, []);
};
Dimension.prototype.update_init = function (init_headings) {
    var ih = (init_headings || []).slice();

    this.dims.forEach(function (sub_dim) {
        // NB: The dimensions will eat their various headings in turn from ih
        sub_dim.update_init(ih);
    });
};
Dimension.prototype.update = function (param_el, target_el) {
    var offset = 0, out = [];

    this.dims.forEach(function (sub_dim, i) {
        // Alter sub dimension's indexes by offset
        out.push.apply(out, sub_dim.update(param_el.childNodes[i], target_el).map(function (act) {
            return {
                name: act.name,
                idx: act.idx + offset,
                count: act.count,
            };
        }));

        // Add post-operations count to the offset
        offset += sub_dim.headers().length;
    });

    return out;
};
module.exports = Dimension;

/** Static dimension: A fixed row
 * { "name": "short_name", "title": "This is a single field", "content": ... }
 **/
function StaticDimension(t) {
    this.name = t.name;
    this.value = t;
}
StaticDimension.prototype.parameterHtml = function () { return ""; };
StaticDimension.prototype.headers = function () { return [ this.name ]; };
StaticDimension.prototype.headerHTML = function (lang) { return [ hodf_utils.tlate(this.value.title || this.name, 'span', lang)]; };
StaticDimension.prototype.dataProperties = function () { return [ to_hot_properties(this.value) ]; };
StaticDimension.prototype.update_init = function (init_headings) {
    if (init_headings.indexOf(this.name) > -1) {
        init_headings.splice(init_headings.indexOf(this.name), 1);
    }
};
StaticDimension.prototype.update = function () { return []; };
dim_registry.static = StaticDimension;


/** Optional dimension: A on/off-able row
 * { "type": "optional", "name": "short_name", "title": "This is an optional field", "enabled": true/false }
 **/
function OptionalDimension(t) {
    this.name = t.name;
    this.title = t.title || t.name;
    this.value = t;
    this.enabled = !!t.enabled;
}
OptionalDimension.prototype.parameterHtml = function (lang) {
    return '<label><input type="checkbox" name="enabled" ' + (this.enabled ? 'checked="checked"' : '') + ' />' + hodf_utils.tlate(this.title, 'span', lang) + '</label>&nbsp;\n';
};
OptionalDimension.prototype.headers = function () {
    return this.enabled ? [ this.name ] : [];
};
OptionalDimension.prototype.headerHTML = function (lang) {
    return this.enabled ? [ hodf_utils.tlate(this.title, 'span', lang) ] : [];
};
OptionalDimension.prototype.dataProperties = function () {
    return this.enabled ? [ to_hot_properties(this.value) ] : [];
};
OptionalDimension.prototype.update_init = function (init_headings) {
    if (init_headings.indexOf(this.name) > -1) {
        this.enabled = true;
        init_headings.splice(init_headings.indexOf(this.name), 1);
    } else {
        this.enabled = false;
    }
};
OptionalDimension.prototype.update = function (parent_el) {
    var prev_enabled = this.enabled, out = [];

    this.enabled = !!(parent_el.querySelector("input[name=enabled]").checked);

    if (this.enabled && !prev_enabled) {
        out.push({ name: 'insert', idx: 0, count: 1 });
    } else if (!this.enabled && prev_enabled) {
        out.push({ name: 'remove', idx: 0, count: 1 });
    }

    return out;
};
dim_registry.optional = OptionalDimension;


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
    return sequence(this.min, this.max).map(function (x) { return to_hot_properties(this); }.bind(this));
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
dim_registry.range = RangeDimension;

// YearDimension inherits RangeDimension
function YearDimension(t) {
    t.overall_min = t.overall_min || 1900;
    t.overall_max = t.overall_max || 2050;
    t.parameter_title = t.parameter_title || { "en": "Years", "es": "Años" };

    RangeDimension.call(this, t);
}
YearDimension.prototype = Object.create(RangeDimension.prototype);
dim_registry.year = YearDimension;

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
dim_registry.bins = BinsDimension;
