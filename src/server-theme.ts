/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="../typings/index.d.ts"/>

import http = require("http");
import fs = require("fs");
import Promise = require("bluebird");
import Theme from "./theme";
import cacheManager from "./cache-manager";

export default class PlayerTheme extends Theme {
	constructor(contents: string) {
		super(contents);
	}

	prepare(path: string) {
		return this.generate(path, body => { return { server: body }; });
	}

	getPath(params: any) {
		return `server/${params.host}/${params.port}`;
	}

	getCacheTimeout() {
		return 5;
	}
}
