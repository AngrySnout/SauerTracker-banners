const Handlebars = require('handlebars');
const Promise = require("bluebird");
const config = require("../config.json");
import cacheManager from "./cache-manager";

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

	let res = cacheManager.fromURL(url);
	promises.push(res[1]);
	return `http://localhost:${config.port}/external/${res[0]}`;
});

Handlebars.registerHelper("flag", function(country) {
	return `${config.sauertrackerURL}/images/flags/${country}.png`;
});

Handlebars.registerHelper("mapshot", function(map) {
	return `${config.sauertrackerURL}/images/mapshots/${map}.jpg`;
});

export default function compile(template) {
	let ct = Handlebars.compile(template);
	return (obj) => {
		let res = ct(obj);
		let ps = promises;
		promises = [];
		return Promise.all(ps).then(() => res);
	}
}
