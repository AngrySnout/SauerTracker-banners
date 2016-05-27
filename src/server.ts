/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="../typings/index.d.ts"/>

require('source-map-support').install();

import express = require("express");
import fs = require("fs");
const bodyParser = require("body-parser");
import PlayerTheme from "./player-theme";
import ServerTheme from "./server-theme";
import ClanTheme from "./clan-theme";
import themeManager from "./theme-manager";
import cacheManager from "./cache-manager";
import {generateError} from "./svg";

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

app.use("/images", express.static("./images"));
app.use("/external", express.static("./external"));

app.listen(config.port, function () {
  console.log(`SauerTracker-banners is listening on port ${config.port}.`);
});

// app.get("/cached", function (req, res) {
// 	res.type("image/png");
//
// 	if (!req.query.hash) {
// 		generateError("Error: No hash supplied").then(svg => res.status(400).send(svg));
// 		return;
// 	}
//
// 	cacheManager.get(req.query.hash.replace(/\//g, ""), null, 20*60, false, true).then(svg => {
// 		res.send(svg);
// 	}).catch(err => {
// 		generateError(err).then(svg => res.status(400).send(svg));
// 	});
// });

app.post("/register", function (req, res) {
	if (!req.body.type) {
		res.status(400).send("Type not provided");
		return;
	}

	if (!req.body.template) {
		res.status(400).send("Template not provided");
		return;
	}

	themeManager.addTheme(req.body.type, req.body.template).then(hash => {
		res.send(hash);
	}).catch(err => {
		res.status(400).send(err);
	});
});

app.get("/player", function (req, res) {
	res.type("image/png");

	if (!req.query.theme) {
		generateError("Error: No theme supplied").then(svg => res.send(svg));
		return;
	}
	if (!req.query.name) {
		generateError("Error: Player name not supplied").then(svg => res.send(svg));
		return;
	}

	themeManager.getPlayer(req.query.theme, null).then((theme: PlayerTheme) => {
		theme.build(req.query).then((svg) => {
			res.send(svg);
		}).catch(err => {
			generateError(err).then(svg => res.send(svg));
		});
	}).catch(err => {
		generateError(err).then(svg => res.send(svg));
	});
});

app.get("/server", function (req, res) {
	res.type("image/png");

	if (!req.query.theme) {
		generateError("Error: No theme supplied").then(svg => res.send(svg));
		return;
	}
	if (!req.query.host || !req.query.port) {
		generateError("Error: Server host and/or port not supplied").then(svg => res.send(svg));
		return;
	}

	themeManager.getServer(req.query.theme, null).then((theme: ServerTheme) => {
		theme.build(req.query).then((svg) => {
			res.send(svg);
		}).catch(err => {
			generateError(err).then(svg => res.send(svg));
		});
	}).catch(err => {
		generateError(err).then(svg => res.send(svg));
	});
});

app.get("/clan", function (req, res) {
	res.type("image/png");

	if (!req.query.theme) {
		generateError("Error: No theme supplied").then(svg => res.send(svg));
		return;
	}
	if (!req.query.clantag) {
		generateError("Error: Clantag not supplied").then(svg => res.send(svg));
		return;
	}

	themeManager.getClan(req.query.theme, req.query.template).then((theme: ClanTheme) => {
		theme.build(req.query).then((svg) => {
			res.send(svg);
		}).catch(err => {
			generateError(err).then(svg => res.send(svg));
		});
	}).catch(err => {
		generateError(err).then(svg => res.send(svg));
	});
});
