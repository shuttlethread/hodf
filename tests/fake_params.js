"use strict";
/*jslint todo: true, regexp: true, plusplus: true */

function FakeParams() {
    var param_els = Array.from(arguments);

    // Find first fake input in (p_el) that matches (name)
    function by_name(p_el, name) {
        var i;

        for (i = 0; i < p_el.length; i++) {
            if (p_el[i].name === name) {
                return p_el[i];
            }
        }
    }

    // Fake being the parent node by providing childNodes & querySelector to get elements within each
    this.childNodes = param_els.map(function (p_el) {
        return {
            querySelector: function (sel) {
                var m = sel.match("(?:input|select)\\[name=(.*)\\]");

                if (m) {
                    return by_name(p_el, m[1]);
                }
                throw new Error("Unknown selector " + sel);
            },
        };
    });

    // Find item by name so we can claim that was the target
    this.target = function (idx, name) {
        return by_name(param_els[idx], name);
    };
}
module.exports = FakeParams;
