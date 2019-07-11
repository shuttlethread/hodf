# HODF: Hands-on-dataframe

A wrapper around [handsontable](https://handsontable.com/) spreadsheet for collecting data.frame objects with a dynamic number of columns / rows.

![hodfr screenshot](screenshot.png)

## Installation / Quick start

The package can be installed via. Yarn / NPM:

    npm install shuttlethread/hodf

Then you can create the hodf element with:

    var Hodf = require('hodf');

    var h = new Hodataframe(
        template,  // Describes requested data, see later
        containing_el,  // HTML element to add HODF to
        (initial_data || {}),  // Initial data frame to populate
    );

Finally you can get the content using:

    console.log(h.getDataFrame());  // R data.frame-like format
    console.log(h.getAofA());  // Array-of-arrays format

## References

* [handsontable](https://handsontable.com/)

## Acknowledgements

Developed as part of [FarFish](https://www.farfish.eu/), which has received funding from the European Union’s Horizon 2020 research and innovation programme under grant agreement no. 727891.
