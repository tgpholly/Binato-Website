const app = require("express")(),
	  bodyParser = require("body-parser"),
	  fs = require("fs"),
	  config = require("./config.json"),
	  printer = require("./printer.js"),
	  login = require("./login.js"),
	  register = require("./register.js"),
	  update_settings = require("./update_settings.js"),
	  change_password = require("./change_password.js"),
	  profile_info = require("./profile_info.js"),
	  delete_user = require("./delete_user.js"),
	  DatabaseHelper = require("./DatabaseHelper.js"),
	  crypto = require("crypto");

global.Database = new DatabaseHelper(config.database.address, config.database.port, config.database.username, config.database.password, config.database.name);

app.use(bodyParser.urlencoded({
	extended: true
}));

app.get("*", async (req, res) => {
	const cleanUrl = req.url.split("?")[0];
	if (cleanUrl == "/" || cleanUrl == "/index") {
		const pageConstructStartTime = Date.now();

		req.cookie = cookieParser(req);
		req.cookieKeys = Object.keys(req.cookie);

		if (req.cookie != null && req.cookieKeys.includes("binato_session")) {
			req.user = await global.Database.query(`SELECT * FROM users_info WHERE web_session = ? LIMIT 1`, [req.cookie["binato_session"]]);
		}

		let generatedContent;
		try {
			generatedContent = await printer.page(req.query.p, req, res);
		} catch (e) {
			generatedContent = "<title>Error - Binato</title>An error occurred during page construction and has been logged";
			console.error(e);
		}

		if (generatedContent == null) return;

		const preExistingTitle = generatedContent.includes("<title>");

		// Headers
		res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
		res.set("X-XSS-Protection", "1; mode=block");
		res.set("Feature-Policy", "fullscreen 'none'");
		res.set("Permissions-Policy", "microphone=(), geolocation=(), magnetometer=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=()");
		res.set("Referrer-Policy", "strict-origin-when-cross-origin");
		res.set("Content-Security-Policy", "block-all-mixed-content;frame-ancestors 'self'");
		res.set("X-Frame-Options", "SAMEORIGIN");
		res.set("X-Content-Type-Options", "nosniff");
		res.set("X-Powered-By", "Binato-Website");

		if (generatedContent != null) {
			res.send(`
				<!DOCTYPE html>
				<html>
					<head>
						${preExistingTitle ? "" : `<title>${await getPageTitle(req.query.p)} - Binato</title>`}

						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1">

						<style>
							body {
								background-color: #181b1e!important;
							}

							h {
								visibility: hidden;
							}

							.page-background {
								background-color: #2b3035!important;
								border-radius: .25rem;
							}

							.no-click {
								pointer-events: none;
							}

							.bottom-border {
								border-bottom: 1px solid #343a40;
							}

							.pfp-border {
								transition: border-width ease-in .1s !important;
								border: 0px solid white;
							}
							
							.pfp-border:hover {
								border-width: 2px;
							}

							.dropdown .show {
								border-width: 2px;
							}

							/* Bootstrap Overrides */
							.dropdown-item:focus, .dropdown-item:hover {
								background-color: #434b53!important;
							}
						</style>

						<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css" integrity="sha512-GQGU0fMMi238uA+a/bdWJfpUGKUkBdgfFdgBm72SUQ6BeyWjoY/ton0tEjH+OSH9iP4Dfh+7HM0I9f5eR0L/4w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
						<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js" integrity="sha512-894YE6QWD5I59HgZOGReFYm4dnWc1Qt5NtvYSaNcOP+u1T9qYdvdihz0PPSiiqn/+/3e7Jo4EaG7TubfWGUrMQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
						<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.bundle.min.js" integrity="sha512-pax4MlgXjHEPfCwcJLQhigY7+N8rt6bVvWLFyUMuxShv170X53TRzGPmPkZmGBhk+jikR8WBM4yl7A9WMHHqvg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
					</head>
					<body>
						${await printer.nav(req.query.p, req.user)}
						<div class="container text-light mt-3 p-4 page-background" style="max-width:1000px">
							${generatedContent}
						</div>

						<script>
							function l() {
								document.cookie='binato_session=; Max-Age=-99999999;';
								window.location.href = "/?p=0";
							}
						</script>
					</body>
				</html>
			`);
		}
		console.log(`Finished generating page, took ${Date.now() - pageConstructStartTime}ms [${req.url}]${req.user != null ? ` (${req.user.username})` : ""}`);
	} else {
		const splitURL = cleanUrl.split("/");
		switch (splitURL[1]) {
			case "reset":
				req.user = await global.Database.query(`SELECT * FROM users_info WHERE password_reset_key = ? AND password_reset_key IS NOT NULL LIMIT 1`, [splitURL[2]]);
				const sessionToken = crypto.randomBytes(32).toString("hex");
				await global.Database.query("UPDATE users_info SET web_session = ?, password_change_required = ? WHERE username = ?", [sessionToken, 1, req.user.username]);
				req.user.password_change_required = 1;
				res.cookie("binato_session", sessionToken, {maxAge:2147483647});
				res.redirect(303, "/?p=107");
				break;

			default:
				fs.access(`${__dirname}/files${req.url}`, fs.F_OK, (err) => {
					if (!err) res.sendFile(`${__dirname}/files${req.url}`);
					else res.status(404).end("404 | Binato-Website");
				});
				break;
		}
	}
});

app.post("*", async (req, res) => {
	req.url = req.url.split("?")[0];

	req.cookie = cookieParser(req);
	req.cookieKeys = Object.keys(req.cookie);

	if (req.cookie != null && req.cookieKeys.includes("binato_session")) {
		req.user = await global.Database.query(`SELECT * FROM users_info WHERE web_session = ? LIMIT 1`, [req.cookie["binato_session"]]);
	}

	switch (req.url) {
		case "/login":
			return res.redirect(303, await login(req.body, res));

		case "/register":
			return res.redirect(303, await register(req.body, req, res));

		case "/update_settings":
			return res.redirect(303, await update_settings(req.body, req, res));

		case "/change_password":
			return res.redirect(303, await change_password(req.body, req, res));

		case "/profile_info":
			return res.redirect(303, await profile_info(req.body, req, res));

		case "/delete_user":
			return res.redirect(303, await delete_user(req.body, req, res));
	}
});

app.listen(config.port, () => console.log(`Listening at port ${config.port}`));

async function getPageTitle(pid = 0) {
	const dbTitle = await global.Database.query(`SELECT title FROM web_titles WHERE id = ? LIMIT 1`, [pid]);
	if (dbTitle == null) return "Page is missing a title in database";
	else return dbTitle["title"];
}

function cookieParser(req) {
	let cookies = req.headers.cookie, cookiesOut = {};
	if (cookies != null) {
		for (let cookie of cookies.split("; ")) {
			cookie = cookie.split("=");
			cookiesOut[cookie[0]] = cookie[1];
		}
		return cookiesOut;
	}
	else return {};
}