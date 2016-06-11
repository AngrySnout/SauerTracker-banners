require('source-map-support').install();

const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
import themeManager from "./theme-manager";
import generateError from "./error";

const config = require("../config.json");

let app = express();

app.set("trust proxy", "loopback");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Cache-Control", "public, max-age=0");
	next();
});

app.use("/external", express.static("./external"));

app.listen(config.port, function () {
  console.log(`SauerTracker-banners is listening on port ${config.port}.`);
});

const types = [ "player", "server", "clan" ];

app.post("/register", function (req, res) {
	if (!req.body.type || types.indexOf(req.body.type) < 0) {
		res.status(400).send("Error: Invalid type");
		return;
	}

	if (!req.body.template) {
		res.status(400).send("Error: Template not provided");
		return;
	}

	themeManager.register(req.body.type, req.body.template).then(hash => {
		res.send(hash);
	}).catch(err => {
		res.status(400).send(err);
	});
});

function sendError(message, url, res) {
	res.type("image/png");
	generateError(message).then(img_ => {
		if (img_ instanceof Array) {
			res.send(img_[0]);
			console.log(`Cache MISS on '${message}' '${url}' (${img_[1]} ms)`);
		} else {
			res.send(img_);
			console.log(`Cache HIT on '${message}' '${url}'`);
		}
	});
}

function sendBanner(type, params, url, res) {
	if (!params.theme) return sendError("Error: No theme supplied", url, res);

	themeManager.get(type, params.theme).then(theme => {
		res.type("image/png");
		return theme.generate(params).then(img_ => {
			if (img_ instanceof Array) {
				res.send(img_[0]);
				console.log(`Cache MISS on '${url}' (${img_[1]} ms)`);
			} else {
				res.send(img_);
				console.log(`Cache HIT on '${url}'`);
			}
		});
	}).catch(e => {
		sendError(`Error: ${e.message}`, url, res);
	});
}

app.get("/player", (req, res) => {
	if (!req.query.name) return sendError("Error: Player name not supplied", req.originalUrl, res);

	sendBanner("player", req.query, req.originalUrl, res);
});

app.get("/server", (req, res) => {
	if (!req.query.host) sendError("Error: Server host not supplied", req.originalUrl, res);
	if (!req.query.port) sendError("Error: Server port not supplied", req.originalUrl, res);

	sendBanner("server", req.query, req.originalUrl, res);
});

app.get("/clan", (req, res) => {
	if (!req.query.clantag) sendError("Error: Clantag not supplied", req.originalUrl, res);

	sendBanner("clan", req.query, req.originalUrl, res);
});

// Cache MISS on "/player?name=!s]Origin&theme=default" (350 ms)
// Cache HIT on "/player?name=!s]Origin&theme=default"
