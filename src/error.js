const fs = require("fs");
const crypto = require("crypto");
const http = require("http");
const Promise = require("bluebird");
import compile from "./template";
import render from "./render";
import cacheManager from "./cache-manager";

export var errorTemplate = compile(`<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg"
 	 width="400px" height="300px">
	<rect x="0" y="0" width="400px" height="300px" fill="white"/>
    <foreignObject x="0px" y="0px"
                    width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
			{{message}}
        </div>
    </foreignObject>
</svg>`);

export default function generateError(message) {
	return new Promise((resolve, reject) => {
		let hash = crypto.createHash("sha256");
		hash.update(message);
		hash = hash.digest("hex");
		let file = `./prerendered/${hash}`;

		fs.stat(file, (err, stats) => {
			if (err && err.code != "ENOENT") {
				console.log(err);
				reject(err);
				return;
			} else {
				if (!err) {
					fs.readFile(file, function (err, data) {
						if (err) reject(err);
						else resolve(data);
					});
					return;
				}

				cacheManager.get("error"+message, 10*60)
                    .then(res => {
                        resolve(res);
                    }).catch(err => {
                        errorTemplate({ message: message }).then(svg => {
    						let buf = new Buffer(svg);

    						render(buf).then(img_ => {
    							cacheManager.fromBuffer("error"+message, img_[0]);
    							resolve(img_);
    						});
                        });
					});
			}
		});
	});
}
