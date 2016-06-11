const http = require("http");
const fs = require("fs");
const crypto = require("crypto");
const Promise = require("bluebird");
const request = require("request");
import compile from "./template";
import cacheManager from "./cache-manager";
import render from "./render";

const get = Promise.promisify(request.get);
const config = require("../config.json");

const prepare = {
	player: function (body) {
			if (!body.player) return null;

			body.player.totalGames = body.totalGames;
			body.player.rank = body.rank;
			body.player.games = body.games;

			return { player: body.player };
	},
	server: function (body) {
		return { server: body };
	},
	clan: function (body) {
		if (!body.clan) return null;

		body.clan.games = body.games;
		body.clan.members = body.members;
		body.clan.info = body.info;
		body.clan.points = Math.round(body.clan.points*100)/100;
		body.clan.rate = Math.round(body.clan.rate*100);

		return { clan: body.clan };
	}
};

const paths = {
		player: function (params) { return `player/${encodeURIComponent(params.name)}`; },
		server: function (params) { return `server/${params.host}/${params.port}`; },
		clan: function (params) { return `clan/${encodeURIComponent(params.clantag)}`; }
};

export default class Theme {
	constructor(type, template) {
		this.type = type;
		this.template = template;
		this.compiledTemplate = compile(template);
		this.cacheTimeout = config.cacheTimeouts[type];
	}

	prepare(path) {
		return get(`${config.sauertrackerURL}api/${path}`).then(res => {
			if (res.statusCode != 200) {
				if (res.statusCode == 404) return Promise.reject(new Error(`Server, player, or clan not found`));
				else return Promise.reject(new Error(`Got response ${res.statusCode} from SauerTracker API`));
			}

			let body = res.body;
			let obj = JSON.parse(body);
			if (obj.error) {
				return Promise.reject(new Error(obj.error));
			}
			obj = prepare[this.type](obj);

			return this.compiledTemplate(obj).then(svg => render(new Buffer(svg)));
		});
	}

	generate(params) {
		let path = paths[this.type](params);
		return cacheManager.get(path+this.template, this.cacheTimeout)
			.catch(err => {
				return this.prepare(path).then(img_ => {
					cacheManager.fromBuffer(path+this.template, img_[0]);
					return img_;
				});
			});
	}
}
