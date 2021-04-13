const path = require('path')
const childProcess = require('child_process')
const phantomjs = require('phantomjs-prebuilt')
const Promise = require("bluebird");
import {TaskQueue} from 'cwait';

const config = require("../config.json");

const binPath = phantomjs.path

const childArgs = [
	path.join(__dirname, '../phantomjs-script.js')
];

// The following is a rewrite of https://github.com/domenic/svg2png/blob/master/lib/svg2png.js

const PREFIX = "data:image/png;base64,";

export function render_t(svg) {
	return new Promise((resolve, reject) => {
		let startTime = Date.now();

		let cp = childProcess.execFile(binPath, childArgs, (err, stdout, stderr) => {
			if (err && err.signal !== "SIGINT") {
				console.log(err);
				reject(new Error("Error running PhantomJS"));
				return;
			}

			let stdout2 = stdout.toString();
			if (stdout2.startsWith(PREFIX)) {
				resolve([Buffer.from(stdout2.substring(PREFIX.length), "base64"), Date.now()-startTime]);
			}

			if (stdout2.length) reject(new Error(stdout2.replace(/\r/g, "").trim()));
			let stderr2 = stderr.toString();
			if (stderr2.length) reject(new Error(stderr2.replace(/\r/g, "").trim()));
			reject(new Error("Error: No data received from the PhantomJS child process"));
		});

	    cp.stdin.cork();
		let aaString = svg.toString("base64");
	    for (let offset = 0; offset < aaString.length; offset += 1024) {
	        cp.stdin.write(aaString.substring(offset, offset + 1024));
	    }
	    cp.stdin.end("\n");

		// Kill the PhantomJS process if it's taking too long
		let running = true;
		cp.on('exit', () => { running = false; } );
		setTimeout(() => {
			if (running) {
				cp.kill('SIGINT');
				reject(new Error("Rendering took too long"));
			}
		}, config.renderTimeLimit);
	});
}

var queueLength = 0;
var queue = new TaskQueue(Promise, config.queueConcurrency);
var render_q = queue.wrap(render_t);

export default function render(svg) {
	if (queueLength >= config.queueMaxLength) return Promise.reject(new Error("Server queue is full"));

	queueLength++;
	return render_q(svg).finally(() => { queueLength--; });
}
