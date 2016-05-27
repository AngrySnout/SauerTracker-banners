/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="../typings/index.d.ts"/>

import fs = require("fs");
import crypto = require("crypto");
import http = require("http");
import Promise = require("bluebird");

const config = require("../config.json");

class CacheManager {
	constructor() {
		setInterval(this.purge, 30*60*1000);
	}

	purge() {
		let tenMinAgo = new Date();
		tenMinAgo.setMinutes(tenMinAgo.getMinutes()-10);

		fs.readdir("./cache", function (err, files) {
			if (err) {
				console.log(err);
				return;
			}

			for (let file in files) {
				let path = `./cache/${files[file]}`;
				fs.stat(path, function (err, stats) {
					if (err) {
						console.log(err);
						return;
					}

					if (stats.mtime < tenMinAgo) {
						fs.unlink(path);
					}
				});
			}
		});
	}

	get(path: string, template: string, cacheTimeout: number) {
		return new Promise((resolve: Function, reject: Function) => {
			if (!config.cache) {
				reject("Cache disabled");
				return;
			}

			let hash = crypto.createHash("sha256");
			hash.update(path);
			hash.update(template);
			hash = hash.digest("hex");
			let outFile = `./cache/${hash}`;

			fs.stat(outFile, (err, stats) => {
				if (err && err.code != "ENOENT") {
					reject(err);
					console.log(err);
					return;
				} else {
					if (!err) {
						let cacheDate = new Date();
						cacheDate.setSeconds(cacheDate.getSeconds()-cacheTimeout);

						if (stats.mtime > cacheDate) {
							fs.readFile(outFile, function (err, data) {
								if (err) reject(err);
								else resolve(data);
							});
							console.log(`Cache HIT on "${path}" ${hash}`);
							return;
						}
					}

					console.log(`Cache MISS on "${path}" ${hash}`);
					reject("Cache entry not found");
				}
			});

			return hash;
		});
	}

	set(path: string, template: string, contents: Buffer) {
		if (!config.cache) return null;

		let hash = crypto.createHash("sha256");
		hash.update(path);
		hash.update(template);
		hash = hash.digest("hex");
		let outFile = `./cache/${hash}`;

		fs.writeFile(outFile, contents);
		return hash;
	}

	external(url) {
		let hash = crypto.createHash("sha256");
		hash.update(url);
		hash = hash.digest("hex");

		let res = [];

		res.push(hash);

		res.push(new Promise((resolve: Function, reject: Function) => {
			let outFile = `./external/${hash}`;

			fs.stat(outFile, (err, stats) => {
				if (err) {
					let file = fs.createWriteStream(outFile);
					let request = http.get(url, response => {
						if (response.statusCode != 200) reject();
						else {
							response.on("data", chunk => {
								file.write(chunk);
							});
							response.on("end", () => {
								file.end();
								resolve();
							});
						}
					});
					return hash;
				} else {
					resolve();
				}
			});
		}));

		return res;
	}
}

let cacheManager = new CacheManager();
export default cacheManager;
