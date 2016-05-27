const Handlebars = require('handlebars');
const svg2png = require("svg2png");
const config = require("../config.json");
import fs = require("fs");
import Promise = require("bluebird");
import cacheManager from "./cache-manager";
import render from "./render";

Handlebars.registerHelper("ifeq", function(v1, v2, options) {
	if(v1 === v2) {
		return options.fn(this);
	}
	return options.inverse(this);
});

Handlebars.registerHelper("iflt", function(v1, v2, options) {
	if(v1 < v2) {
		return options.fn(this);
	}
	return options.inverse(this);
});

Handlebars.registerHelper("iflte", function(v1, v2, options) {
	if(v1 <= v2) {
		return options.fn(this);
	}
	return options.inverse(this);
});

Handlebars.registerHelper("ifgt", function(v1, v2, options) {
	if(v1 > v2) {
		return options.fn(this);
	}
	return options.inverse(this);
});

Handlebars.registerHelper("ifgte", function(v1, v2, options) {
	if(v1 >= v2) {
		return options.fn(this);
	}
	return options.inverse(this);
});

let promises = [];

Handlebars.registerHelper("cache", function(url) {
	if (!config.externalCache) return url;

	let res = cacheManager.external(url);
	promises.push(res[1]);
	return `http://localhost:${config.port}/external/${res[0]}`;
});

Handlebars.registerHelper("flag", function(country) {
	return `${config.sauertrackerURL}/images/flags/${country}.png`;
});

Handlebars.registerHelper("mapshot", function(map) {
	return `${config.sauertrackerURL}/images/mapshots/${map}.jpg`;
});

export default function makeSVG(compiledTemplate: any, obj: any) {
	return new Promise((resolve, reject) => {
		try {
			let svg = compiledTemplate(obj);
			let buf = new Buffer(svg);

			let ps = promises;
			promises = [];

			Promise.all(ps).then(() => {
				resolve(render(buf));
			});
		} catch (err) {
			reject(err);
		}
	});
}

let errorTemplate = Handlebars.compile(`<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg"
 	 width="400px" height="300px">
	<rect x="0" y="0" width="400px" height="300px" fill="white"/>
    <foreignObject x="0px" y="0px"
                    width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
			{{message}}
        </div>
    </foreignObject>
</svg>`);

export function generateError(message) {
	return new Promise((resolve, reject) => {
		let svg = errorTemplate({ message: message });
		let buf = new Buffer(svg);
		resolve(render(buf));
	});
}
