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
	  save_user = require("./save_user"),
	  DatabaseHelper = require("./DatabaseHelper.js"),
	  crypto = require("crypto"),
	  multer = require("multer");

global.Database = new DatabaseHelper(config.database.address, config.database.port, config.database.username, config.database.password, config.database.name);

app.use(bodyParser.urlencoded({
	extended: true
}));

let cachedSessions = [];

app.get(/(.*)/, async (req, res) => {
	const cleanUrl = req.url.split("?")[0];
	if (cleanUrl == "/" || cleanUrl == "/index") {
		const pageConstructStartTime = Date.now();

		req.cookie = cookieParser(req);
		req.cookieKeys = Object.keys(req.cookie);

		if (req.cookie != null && req.cookieKeys.includes("binato_session")) {
			req.user = await global.Database.query(`SELECT * FROM users_info WHERE web_session = ? LIMIT 1`, [req.cookie["binato_session"]]);
		}

		const darkMode = req.cookieKeys.includes("dark-mode") ? req.cookie["dark-mode"] === "true" : true;

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

						${req.user == null ? "" : `<link rel="preload" as="image" href="${config.profilepicture_url}${req.user.id}?${req.user.web_pfp_cacheid}">`}

						<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css" integrity="sha512-GQGU0fMMi238uA+a/bdWJfpUGKUkBdgfFdgBm72SUQ6BeyWjoY/ton0tEjH+OSH9iP4Dfh+7HM0I9f5eR0L/4w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
						<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.9.1/font/bootstrap-icons.min.css" integrity="sha512-5PV92qsds/16vyYIJo3T/As4m2d8b6oWYfoqV+vtizRB6KhF1F9kYzWzQmsO6T3z3QG2Xdhrx7FQ+5R1LiQdUA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
						<link rel="stylesheet" type="text/css" href="/custom.css">
						<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js" integrity="sha512-894YE6QWD5I59HgZOGReFYm4dnWc1Qt5NtvYSaNcOP+u1T9qYdvdihz0PPSiiqn/+/3e7Jo4EaG7TubfWGUrMQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
						<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.bundle.min.js" integrity="sha512-pax4MlgXjHEPfCwcJLQhigY7+N8rt6bVvWLFyUMuxShv170X53TRzGPmPkZmGBhk+jikR8WBM4yl7A9WMHHqvg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
					</head>
					<body class="${darkMode ? "dark-mode" : "light-mode"}">
						${await printer.nav(req.query.p, req.user)}
						<div class="container mt-3 p-4 page-background" style="max-width:1000px">
							${generatedContent}
						</div>

						<script>
							${`function l() {
								document.cookie='binato_session=; Max-Age=-99999999;';
								window.location.href = "/?p=0";
							}

							let darkModeState = "|||JSDARKMODESTATE|||";

							function switchModes() {
								document.cookie='dark-mode=; Max-Age=-99999999;';
								document.body.classList.toggle("light-mode");
								document.body.classList.toggle("dark-mode");
								darkModeState = !darkModeState;
								document.cookie="dark-mode=" + darkModeState;
							}`.replace("\"|||JSDARKMODESTATE|||\"", darkMode)}
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
				if (req.user == undefined) {
					return res.redirect(303, "/");
				}
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

if (!fs.existsSync(".pfpTemp")) {
	fs.mkdirSync(".pfpTemp");
}
const pfpUpload = multer({
	dest: ".pfpTemp"
});

app.post("/update_pfp", pfpUpload.single("pfp"), async (req, res) => {
	if (req.file != undefined) {
		req.cookie = cookieParser(req);
		req.cookieKeys = Object.keys(req.cookie);

		if (req.cookie != null && req.cookieKeys.includes("binato_session")) {
			req.user = await global.Database.query(`SELECT * FROM users_info WHERE web_session = ? LIMIT 1`, [req.cookie["binato_session"]]);
		}

		if (req.user == null) {
			return res.status(400).end("");
		}

		fs.rename(__dirname + "/" + req.file.path, `/home/holly/development/Binato-ProfilePicture/ProfilePictures/${req.user.id}.png`, async () => {
			// Update cache id
			await global.Database.query("UPDATE users_info SET web_pfp_cacheid = web_pfp_cacheid + 1 WHERE id = ?", [req.user.id]);
			return res.status(200).end("");
		});
	}
})

app.post(/(.*)/, async (req, res) => {
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

		case "/save_user":
			return res.redirect(303, await save_user(req.body, req, res));

		case "/update_pfp":
			
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