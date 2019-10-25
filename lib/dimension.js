"use strict";
/*jslint todo: true, regexp: true, browser: true, unparam: true, plusplus: true */
/*global Promise */
var hodf_utils = require('./hodf_utils.js');
var sequence = require('./sequence.js').sequence;

var dim_registry = {
    'static': require('./dimension_static.js'),
    'optional': require('./dimension_optional.js'),
    'timeseries': require('./dimension_timeseries.js'),
    'range': require('./dimension_range.js').RangeDimension,
    'year': require('./dimension_range.js').YearDimension,
    'bins': require('./dimension_range.js').BinsDimension,
};


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
