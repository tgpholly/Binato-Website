const md5 = require("md5"),
	  aes256 = require("aes256"),
	  ahttp = require("./AsyncHttpRequest.js"),
	  {v4: uuid} = require("uuid"),
	  config = require("./config.json");

module.exports = async function(loginInfo, req, res) {
	if (loginInfo.ha !== loginInfo.cha) return `/?p=101&e=1`;

	if (loginInfo.u == "" || loginInfo.u.includes(" ")) return `/?p=101&e=0`;

	if (loginInfo.em == "" || !loginInfo.em.includes("@")) return `/?p=101&e=2`;

	// Get users IP for getting location
	// Get cloudflare requestee IP first
	let requestIP = req.get("cf-connecting-ip");

	// Get IP of requestee since we are probably behind a reverse proxy
	if (requestIP == null)
		requestIP = req.get("X-Real-IP");

	// Just get the requestee IP (we are not behind a reverse proxy)
	if (requestIP == null)
		requestIP = req.remote_addr;

	// Make sure requestIP is never null
	if (requestIP == null)
		requestIP = "";

	let userCountry;
	// Check if it is a local or null IP
	if (requestIP.includes("192.168.") || requestIP.includes("127.0.") || requestIP == "") {
		// Set location to null island
		userCountry = "xx";
	} else {
		// Get user's location using zxq
		userCountry = (await ahttp(`http://ip.zxq.co/${requestIP}`, "json"))["country"].toLowerCase();
	}

	const sessionToken = uuid().split("-").join("") + uuid().split("-").join("");

	console.log("New user registration: " + loginInfo.u);

	await global.Database.query("INSERT INTO users_info (id, username, username_safe, password, email, country, reg_date, last_login_date, last_played_mode, online_now, tags, supporter, web_session, verification_needed, password_change_required, has_old_password, away_message) VALUES (NULL, ?, ?, ?, ?, ?, CURRENT_TIME(), CURRENT_TIME(), '0', '0', '4', '0', ?, '1', '0', '0', '');", [
		loginInfo.u, loginInfo.u.toLowerCase().split(" ").join("_"), aes256.encrypt(config.database.databaseKey, md5(loginInfo.ha)),
		loginInfo.em, userCountry, sessionToken
	]);
	
	const newUserInformation = await global.Database.query(`SELECT * FROM users_info WHERE web_session = ? LIMIT 1`, [sessionToken]);

	for (let i = 0; i < 4; i++) {
		await global.Database.query(`INSERT INTO users_modes_info (n, user_id, mode_id, count300, count100, count50, countmiss, playcount, total_score, ranked_score, pp_rank, pp_raw, count_rank_ss, count_rank_s, count_rank_a, pp_country_rank, playtime, avg_accuracy, level) VALUES (NULL, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`, [
			newUserInformation.id, i
		]);
	}

	await global.Database.query("INSERT INTO web_prefs (id, keyboard, mouse, tablet, touch, location, interests) VALUES (?, 0, 0, 0, 0, '', '')", [newUserInformation.id]);

	res.cookie("binato_session", sessionToken, {maxAge:2147483647});

	return `/?p=50&u=${newUserInformation.id}&m=0`;
}