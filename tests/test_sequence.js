"use strict";
/*jslint todo: true, regexp: true, plusplus: true */
var test = require('tape');

var sequence = require('../lib/sequence.js').sequence;

test('Dimension:SingleDimension', function (t) {
    t.deepEqual(sequence(1, 10), ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], "1..10");
    t.deepEqual(sequence(5, 9), ["5", "6", "7", "8", "9", ], "5..9");

    t.throws(function () { sequence(9, 5); }, /should be smaller/, "9 to 5 doesn't work");
    t.end();
});