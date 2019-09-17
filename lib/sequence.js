"use strict";
/*jslint plusplus: true */

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
module.exports.sequence = sequence;
