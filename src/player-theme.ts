/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="../typings/index.d.ts"/>

import http = require("http");
import fs = require("fs");
import Promise = require("bluebird");
import Theme from "./theme";

export default class PlayerTheme extends Theme {
	constructor(template: string) {
		super(template);
	}

	prepare(path: string) {
		return this.generate(path, function (body) {
			if (!body.player) return null;

			body.player.totalGames = body.totalGames;
			body.player.rank = body.rank;
			body.player.games = body.games;

			return { player: body.player };
		});
	}

	getPath(params: any) {
		return `player/${encodeURIComponent(params.name)}`;
	}

	getCacheTimeout() {
		return 10*60;
	}
}
