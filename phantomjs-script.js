// This file is a modified version of https://github.com/domenic/svg2png/blob/master/lib/converter.js

/* global phantom: true */

var webpage = require("webpage");
var system = require("system");

var PREFIX = "data:image/svg+xml;base64,";

convert();

function convert() {
    var page = webpage.create();
    page.settings.javascriptEnabled = false;
    var sourceBase64 = system.stdin.readLine();

    page.open(PREFIX + sourceBase64, function (status) {
        if (status !== "success") {
            console.error("Unable to load the source file.");
            phantom.exit();
            return;
        }

        try {
            var dimensions = getSVGDimensions(page);
            if (!dimensions) {
                console.error("Width or height could not be determined from either the source file or the supplied " +
                              "dimensions");
                phantom.exit();
                return;
            }

            page.viewportSize = {
                width: dimensions.width,
                height: dimensions.height
            };
        } catch (e) {
            console.error("Unable to calculate or set dimensions.");
            console.error(e);
            phantom.exit();
            return;
        }

        var result = "data:image/png;base64," + page.renderBase64("PNG");
        system.stdout.write(result);
        phantom.exit();
    });
}

function getSVGDimensions(page) {
    var width = parseInt(/<svg.+width=["']([0-9%]*)\w*["'].*?>/g.exec(page.content)[1]);
    var height = parseInt(/<svg.+height=["']([0-9%]*)\w*["'].*?>/g.exec(page.content)[1]);

    var widthIsPercent = /%\s*$/.test(width || ""); // Phantom doesn't have endsWith
    var heightIsPercent = /%\s*$/.test(height || "");
    var width = !widthIsPercent && parseFloat(width);
    var height = !heightIsPercent && parseFloat(height);

    if (width && height) {
        return { width: width, height: height };
    }

    var viewBox = /<svg.*viewbox="([0-9 ]*)".*?>/g.exec(page.content);
    var viewBoxWidth;
    var viewBoxHeight;
    if (viewBox && viewBox.length > 0) {
        viewBox = viewBox[0].split(" ");
        viewBoxWidth = parseInt(viewBox[2]);
        viewBoxHeight = parseInt(viewBox[3]);
    }

    if (width && viewBoxHeight) {
        return { width: width, height: width * viewBoxHeight / viewBoxWidth };
    }

    if (height && viewBoxWidth) {
        return { width: height * viewBoxWidth / viewBoxHeight, height: height };
    }

    return null;
}
