const crypto = require("crypto");
const fs = require("fs");
const Promise = require('bluebird');
import {render_t} from "./render";
import {errorTemplate} from "./error";

const writeFile = Promise.promisify(fs.writeFile);

const messages = [
	"Error running PhantomJS",
	"No data received from the PhantomJS child process",
	"Error: Server, player, or clan not found",
	"Error: Player name not supplied",
	"Error: Server host not supplied",
	"Error: Server port not supplied",
	"Error: Clantag not supplied",
	"Error: No theme supplied",
	"Error: Server queue is full",
	"Error: Rendering took too long"
];

Promise.map(messages, message => {
	return errorTemplate({ message: message }).then(template => {
		return render_t(new Buffer(template)).then(img_ => {
			let hash = crypto.createHash("sha256");
			hash.update(message);
			hash = hash.digest("hex");

			return writeFile(`./prerendered/${hash}`, img_[0]);
		});
	});
}, { concurrency: 2 }).then(() => process.exit());
