"use strict";
/*jslint todo: true, regexp: true, browser: true, unparam: true, plusplus: true */
/*global Promise */
var hodf_utils = require('./hodf_utils.js');


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
    return this.enabled ? [ hodf_utils.to_hot_properties(this.value) ] : [];
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
module.exports = OptionalDimension;
