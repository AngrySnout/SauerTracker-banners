/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="../typings/index.d.ts"/>

import http = require("http");
import fs = require("fs");
import Promise = require("bluebird");
import Theme from "./theme";
import cacheManager from "./cache-manager";

export default class ClanTheme extends Theme {
	constructor(contents: string) {
		super(contents);
	}

	prepare(path: string) {
		return this.generate(path, function (body) {
			if (!body.clan) return null;

			body.clan.games = body.games;
			body.clan.members = body.members;
			body.clan.info = body.info;
			body.clan.points = Math.round(body.clan.points*100)/100;
			body.clan.rate = Math.round(body.clan.rate*100);

			return { clan: body.clan };
		});
	}

	getPath(params: any) {
		return `clan/${encodeURIComponent(params.clantag)}`;
	}

	getCacheTimeout() {
		return 10*60;
	}
}
