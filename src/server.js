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

function sendError(message, res) {
	res.type("image/png");
	generateError(message).then(img => { res.send(img); });
}

function sendBanner(type, params, res) {
	if (!params.theme) return sendError("Error: No theme supplied", res);

	themeManager.get(type, params.theme).then(theme => {
		res.type("image/png");
		return theme.generate(params).then(img => { res.send(img); });
	}).catch(e => {
		sendError(`Error: ${e.message}`, res);
	});
}

app.get("/player", (req, res) => {
	if (!req.query.name) return sendError("Error: Player name not supplied", res);

	sendBanner("player", req.query, res);
});

app.get("/server", (req, res) => {
	if (!req.query.host) sendError("Error: Server host not supplied", res);
	if (!req.query.port) sendError("Error: Server port not supplied", res);

	sendBanner("server", req.query, res);
});

app.get("/clan", (req, res) => {
	if (!req.query.clantag) sendError("Error: Clantag not supplied", res);

	sendBanner("clan", req.query, res);
});
