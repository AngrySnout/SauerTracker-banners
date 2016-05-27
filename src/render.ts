const path = require('path')
const childProcess = require('child_process')
const phantomjs = require('phantomjs-prebuilt')
const binPath = phantomjs.path
import Promise = require("bluebird");

const childArgs = [
	path.join(__dirname, '../phantomjs-script.js')
];

// The following is a rewrite of https://github.com/domenic/svg2png/blob/master/lib/svg2png.js

const PREFIX = "data:image/png;base64,";

export default function render(svg: Buffer) {
	return new Promise((resolve, reject) => {
		let cp = childProcess.execFile(binPath, childArgs, (err, stdout, stderr) => {
			if (err) reject(err);

			let stdout2 = stdout.toString();
			if (stdout2.startsWith(PREFIX)) {
				resolve(new Buffer(stdout2.substring(PREFIX.length), "base64"));
			}

			if (stdout2.length) reject(new Error(stdout2.replace(/\r/g, "").trim()));
			let stderr2 = stderr.toString();
			if (stderr2.length) reject(new Error(stderr2.replace(/\r/g, "").trim()));
			reject(new Error("No data received from the PhantomJS child process"));
		});

	    cp.stdin.cork();
		let aaString = svg.toString("base64");
	    for (let offset = 0; offset < aaString.length; offset += 1024) {
	        cp.stdin.write(aaString.substring(offset, offset + 1024));
	    }
	    cp.stdin.end("\n");
	});
}
