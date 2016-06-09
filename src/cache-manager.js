const fs = require("fs");
const crypto = require("crypto");
const http = require("http");
const Promise = require("bluebird");

const config = require("../config.json");

class CacheManager {
	constructor() {
		setInterval(this.purge, 30*60*1000);
	}

	purge() {
		let cacheTimeout = new Date();
		cacheTimeout.setSeconds(cacheTimeout.getSeconds()-config.maxCacheTimeout);

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

					if (stats.mtime < cacheTimeout) {
						fs.unlink(path);
					}
				});
			}
		});
	}

	get(name, cacheTimeout) {
		return new Promise((resolve, reject) => {
			let hash = crypto.createHash("sha256");
			hash.update(name);
			hash = hash.digest("hex");
			let outFile = `./cache/${hash}`;

			fs.stat(outFile, (err, stats) => {
				if (err && err.code != "ENOENT") {
					console.log(err);
					reject(err);
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
							console.log(`Cache HIT on ${hash}`); //"${name}"
							return;
						}
					}

					console.log(`Cache MISS on ${hash}`); // "${name}"
					reject(new Error("Cache entry not found"));
				}
			});
		});
	}

	fromBuffer(name, contents) {
		let hash = crypto.createHash("sha256");
		hash.update(name);
		hash = hash.digest("hex");
		let outFile = `./cache/${hash}`;

		fs.writeFile(outFile, contents);
		return hash;
	}

	fromURL(url) {
		let hash = crypto.createHash("sha256");
		hash.update(url);
		hash = hash.digest("hex");

		let res = [];

		res.push(hash);

		res.push(new Promise((resolve, reject) => {
			let outFile = `./external/${hash}`;

			fs.stat(outFile, (err, stats) => {
				if (err) {
					let file = fs.createWriteStream(outFile);
					let request = http.get(url, response => {
						if (response.statusCode != 200) reject(new Error(`Got status code ${response.statusCode} from server`));
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

var cacheManager = new CacheManager();
export default cacheManager;
