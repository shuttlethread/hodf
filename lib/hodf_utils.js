"use strict";
/*jslint todo: true, regexp: true, nomen: true, plusplus: true */

function rotate(ar) {
    var rotated, i, j;

    function new_array(len, fn) {
        var out = [], k;

        for (k = 0; k < len; k++) {
            out.push(fn());
        }
        return out;
    }

    // Generate matrix of appropriate dimensions
    rotated = new_array(ar[0].length, function () {
        return new_array(ar.length, function () {
            return [];
        });
    });

    // Flip data around
    for (i = 0; i < ar.length; i++) {
        for (j = 0; j < ar[0].length; j++) {
            rotated[j][i] = ar[i][j];
        }
    }

    return rotated;
}

function df_to_aofa(df, field_headings, value_headings, orientation) {
    var out;

    // Generate aofa, assume fields are rows, values are columns
    out = field_headings.map(function (field) {
        return value_headings.map(function (value) {
            var val = (df[field] || {})[df._headings.values.indexOf(value)];

            return val === undefined ? null : val;
        });
    });

    // Rotate if required
    if (orientation !== 'vertical') {
        out = rotate(out);
    }

    return out;
}
module.exports.df_to_aofa = df_to_aofa;

function aofa_to_df(aoa, orientation) {
    var i, out = { _headings: { fields: [] } };

    // Rotate if required
    if (orientation !== 'vertical') {
        aoa = rotate(aoa);
    }

    // First row should be value headings
    out._headings.values = aoa.shift();
    out._headings.values.shift();
    out._headings.fields = [];

    // Rest should map to columns
    for (i = 0; i < aoa.length; i++) {
        out._headings.fields.push(aoa[i][0]);
        out[aoa[i][0]] = aoa[i].slice(1);
    }

    return out;
}
module.exports.aofa_to_df = aofa_to_df;

function tlate(obj, html_tag, sel_lang) {
    if (!obj) {
        return '';
    }

    if (typeof obj === 'string') {
        return '<' + html_tag + '>' + obj + '</' + html_tag + '>';
    }

    if (sel_lang === '*') {
        return Object.keys(obj).map(function (l) {
            return '<' + html_tag + ' lang="' + l + '">' + obj[l] + '</' + html_tag + '>';
        }).join("\n");
    }

    if (obj[sel_lang]) {
        return '<' + html_tag + ' lang="' + sel_lang + '">' + obj[sel_lang] + '</' + html_tag + '>';
    }
    return '<' + html_tag + ' lang="en">' + obj.en + '</' + html_tag + '>';
}
module.exports.tlate = tlate;

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
module.exports.to_hot_properties = to_hot_properties;
