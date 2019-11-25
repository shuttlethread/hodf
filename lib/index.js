"use strict";
/*jslint todo: true, regexp: true, browser: true, unparam: true, plusplus: true, bitwise: true, nomen: true */
/*global Promise */
var Handsontable = require('handsontable');
var Dimension = require('./dimension.js');
var hodf_utils = require('./hodf_utils.js');

/**
  * Create Hodataframe within element el
  * @constructor
  * @param {Object} tmpl         The Hodataframe template to use for this element
  * @param {Element} el          The HTML element the control should sit within
  * @param {Object} initial_data Initial values to populate table with, either array-of-arrays or JSON data frame
  * @param {String} initial_lang ISO language code to prefer, if available in title/description items, or '*' for all languages in separate elements (default 'en')
  */
function Hodataframe(tmpl, el, inital_data, initial_lang) {
    var hot, hotParams, cols, rows,
        customData = {};

    if (!inital_data) {
        inital_data = { _headings: {}};
    } else if (Array.isArray(inital_data)) {
        // If it's an array, convert back into df
        inital_data = hodf_utils.aofa_to_df(inital_data, tmpl.orientation);
    }

    if (!initial_lang) {
        initial_lang = 'en';
    }

    if (tmpl.text) {
        el.innerHTML = tmpl.text;
        return null;
    }

    customData.fields = new Dimension(tmpl.fields);
    customData.fields.update_init(inital_data._headings.fields);
    customData.values = new Dimension(tmpl.values);
    customData.values.update_init(inital_data._headings.values);
    cols = tmpl.orientation === 'vertical' ? customData.values : customData.fields;
    rows = tmpl.orientation === 'vertical' ? customData.fields : customData.values;

    el.innerHTML = [
        hodf_utils.tlate(tmpl.title, 'h3', initial_lang),
        hodf_utils.tlate(tmpl.description, 'p', initial_lang),
        '<div class="parameters">',
        '<span class="cols">' + cols.parameterHtml(initial_lang) + '</span>',
        '<span class="rows">' + rows.parameterHtml(initial_lang) + '</span>',
        '</div>',
        '<div class="hot"></div>',
    ].join("\n");

    hotParams = JSON.parse(JSON.stringify(tmpl.params || {}));
    hotParams.stretchH = 'all';
    hotParams.autoWrapRow = true;
    hotParams.rowHeaders = rows.headerHTML(initial_lang);
    hotParams.startRows = hotParams.rowHeaders.length;
    hotParams.colHeaders = cols.headerHTML(initial_lang);
    hotParams.startCols = hotParams.colHeaders.length;
    hotParams.data = inital_data._headings.fields ? hodf_utils.df_to_aofa(
        inital_data,
        customData.fields.headers(),
        customData.values.headers(),
        tmpl.orientation
    ) : undefined;
    hotParams.cells = function (row, column) {
        // Set cell properties based on fields
        return customData.fields.dataProperties()[tmpl.orientation === 'vertical' ? row : column];
    };
    hot = new Handsontable(el.querySelector('.hot'), hotParams);
    hot.customData = customData;

    el.querySelector(".parameters").addEventListener('change', function (e) {
        cols.update(el.querySelector(".parameters > .cols"), e.target).forEach(function (act) {
            hot.alter(act.name + '_col', act.idx, act.count);
        });
        rows.update(el.querySelector(".parameters > .rows"), e.target).forEach(function (act) {
            hot.alter(act.name + '_row', act.idx, act.count);
        });

        hot.updateSettings({
            rowHeaders: rows.headerHTML(initial_lang),
            colHeaders: cols.headerHTML(initial_lang),
            cells: function (row, column) {
                // Set cell properties based on fields
                return customData.fields.dataProperties()[tmpl.orientation === 'vertical' ? row : column];
            },
        });
    });

    this.el = el;
    this.hot = hot;
    this.tmpl = tmpl;
    this.name = tmpl.name;
    this.initial_lang = initial_lang;
}

/**
  * Return current data as a data.frame
  */
Hodataframe.prototype.getDataFrame = function () {
    var i,
        out = { _headings: {} },
        data = this.hot.getData();

    function return_ith_value(row) {
        return row[i];
    }

    out._headings.fields = this.hot.customData.fields.headers();
    out._headings.values = this.hot.customData.values.headers();

    // Turn table data into a data.frame-esque object of fields
    for (i = 0; i < out._headings.fields.length; i++) {
        if (this.tmpl.orientation === "vertical") {
            // Map rows to values
            out[out._headings.fields[i]] = data[i];
        } else {
            // Map columns to values
            out[out._headings.fields[i]] = data.map(return_ith_value);
        }
    }
    return out;
};

/**
  * Return current data as an array-of-arrays, including headers
  */
Hodataframe.prototype.getAofA = function () {
    var i, data, rowHeaders, colHeaders;

    data = this.hot.getData();
    rowHeaders = this.hot.customData[this.tmpl.orientation === 'vertical' ? 'fields' : 'values'].headers();
    colHeaders = this.hot.customData[this.tmpl.orientation === 'vertical' ? 'values' : 'fields'].headers();

    // Add column header
    data.unshift(colHeaders);

    // Add row headers
    for (i = 0; i < data.length; i++) {
        data[i].unshift(i > 0 ? rowHeaders[i - 1] : null);
    }
    return data;
};

/**
  * Destroy existing HODF and replace with a new table containing data
  *
  * @param {Object} data New values to populate table with, either array-of-arrays or JSON data frame
  */
Hodataframe.prototype.replace = function (data) {
    // Generate new DF and return it.
    this.hot.destroy();
    this.el.innerHTML = '';
    return new Hodataframe(this.tmpl, this.el, data, this.initial_lang);
};

module.exports = Hodataframe;
