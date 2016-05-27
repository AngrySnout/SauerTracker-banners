/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="../typings/index.d.ts"/>

import http = require("http");
import fs = require("fs");
import crypto = require("crypto");
import Promise = require("bluebird");
import PlayerTheme from "./player-theme";
import ServerTheme from "./server-theme";
import ClanTheme from "./clan-theme";

class ThemeManager {
	getPlayer(name: string, template?: string) {
		return new Promise((resolve, reject) => {
			if (!template) {
				fs.readFile(`./themes/${name}.player`, "utf8", (err, theme) => {
					if (err) {
						reject(`Error: Could not find player theme ${name}`);
						return;
					}
					resolve(new PlayerTheme(theme));
				});
			}
			else resolve(new PlayerTheme(template));
		});
	}

	getServer(name: string, template?: string) {
		return new Promise((resolve, reject) => {
			if (!template) {
				fs.readFile(`./themes/${name}.server`, "utf8", (err, theme) => {
					if (err) {
						reject(`Error: Could not find server theme ${name}`);
						return;
					}
					resolve(new ServerTheme(theme));
				});
			}
			else resolve(new ServerTheme(template));
		});
	}

	getClan(name: string, template?: string) {
		return new Promise((resolve, reject) => {
			if (!template) {
				fs.readFile(`./themes/${name}.clan`, "utf8", (err, theme) => {
					if (err) {
						reject(`Error: Could not find clan theme ${name}`);
						return;
					}
					resolve(new ClanTheme(theme));
				});
			}
			else resolve(new ClanTheme(template));
		});
	}

	addTheme(type: string, template: string) {
		return new Promise((resolve, reject) => {
			try {
				let hash = crypto.createHash("sha256");
				hash.update(template);
				hash = hash.digest("hex");
				let outFile = `./themes/${hash}.${type}`;

				fs.writeFile(outFile, template);
				resolve(hash);
			} catch (err) {
				reject(err);
			}
		});
	}
}

let themeManager = new ThemeManager();
export default themeManager;
