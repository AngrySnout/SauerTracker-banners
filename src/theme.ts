/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="../typings/index.d.ts"/>

const Handlebars = require('handlebars');
import http = require("http");
import Promise = require("bluebird");
import makeSVG from "./svg";
import cacheManager from "./cache-manager";

const config = require("../config.json");

export default class Theme {
	template: string;
	compiledTemplate: any;

	constructor(template: string) {
		this.template = template;
		this.compiledTemplate = Handlebars.compile(template);
	}

	generate(path: string, prepare?: Function) {
		return new Promise((resolve, reject) => {
			http.get(config.sauertrackerURL+"api/"+path, (res) => {
				if (res.statusCode != 200) {
					if (res.statusCode == 404) reject(`Error: Server, player, or clan not found`);
					else reject(`Error: Got response ${res.statusCode} from SauerTracker API`);
					return;
				}

				let body = "";
				res.setEncoding('utf8');
				res.on('data', (chunk) => {
					body += chunk;
				});

				res.on('end', () => {
					if (!body) {
						reject(`Error: Response from SauerTracker API is empty`);
					} else {
						try {
							let obj = JSON.parse(body);

							if (obj.error) {
								reject(`Error: ${obj.error}`);
							}

							if (prepare) obj = prepare(obj);
							var img = makeSVG(this.compiledTemplate, obj);

							img.then(svg => resolve(svg)).catch(e => reject(`Error: ${e.message}`));
						} catch (e) {
							reject(`Error: ${e.message}`);
						}
					}
				});
				res.resume();
			}).on("error", (e) => {
				reject(`Error: ${e.message}`);
			});
		});
	}

	prepare(path: string) { return null; }
	getPath(params: any) { return null; }
	getCacheTimeout() { return null; }

	build(params: any) {
		return new Promise((resolve: Function, reject: Function) => {
			let path = this.getPath(params);
			cacheManager.get(path, this.template, this.getCacheTimeout()).then(img => {
				resolve(img);
			}).catch(err => {
				this.prepare(path).then((img: any) => {
					let cacheName = cacheManager.set(path, this.template, img);
					resolve(img);
				}).catch(err => {
					reject(err);
				});
			});
		});
	}
}
