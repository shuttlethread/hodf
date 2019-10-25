"use strict";
/*jslint todo: true, regexp: true, browser: true, unparam: true, plusplus: true */
/*global Promise */
var hodf_utils = require('./hodf_utils.js');

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
StaticDimension.prototype.dataProperties = function () { return [ hodf_utils.to_hot_properties(this.value) ]; };
StaticDimension.prototype.update_init = function (init_headings) {
    if (init_headings.indexOf(this.name) > -1) {
        init_headings.splice(init_headings.indexOf(this.name), 1);
    }
};
StaticDimension.prototype.update = function () { return []; };
module.exports = StaticDimension;
