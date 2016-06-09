const fs = require("fs");
const crypto = require("crypto");
const Promise = require("bluebird");
import Theme from "./theme";

const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);

class ThemeManager {
	constructor() {
		this.cached = {
			player: {},
			server: {},
			clan: {}
		};

		// TODO: populate cache
	}

	get(type, name) {
		if (this.cached[type][name]) return this.cached[type][name];
		return readFile(`./themes/${name}.${type}`, "utf8")
			.then(template => new Theme(type, template))
			.catch(e => { throw new Error(`Could not find ${type} theme '${name}'`); });
	}

	fromTemplate(type, template) {
		return Promise.resolve(new theme(type, template));
	}

	register(type, template) {
		let hash = crypto.createHash("sha256");
		hash.update(template);
		hash = hash.digest("hex");

		return writeFile(`./themes/${hash}.${type}`, template).then(() => hash);
	}
}

var themeManager = new ThemeManager();
export default themeManager;
