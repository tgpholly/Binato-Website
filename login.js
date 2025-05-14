const md5 = require("md5"),
	  aes256 = require("aes256"),
	  config = require("./config.json"),
	  crypto = require("crypto");

module.exports = function(loginInfo, res) {
	return new Promise(async (resolve, reject) => {
		const dbInfo = await global.Database.query("SELECT id, password_hash, password_salt, password_change_required, has_old_password FROM users_info WHERE username = ? LIMIT 1", [loginInfo.u]);

		if (dbInfo == null) return resolve("/?p=100&e=0");

		if (loginInfo.u.length > 15 || loginInfo.ha.length > 100) return resolve("/?p=100&e=1");

		if (loginInfo.ha == "") return resolve("/?p=100&e=0");

		console.log("User login: " + loginInfo.u);

		if (dbInfo.has_old_password === 1) {
			if (dbInfo.password_hash === md5(loginInfo.ha)) {
				await completeLogin(res, loginInfo);
				return resolve("/?p=107");
			}
			else return resolve("/?p=100&e=0");
		} else if (dbInfo.has_old_password === 2) {
			if (aes256.decrypt(config.database.key, dbInfo.password_hash) === md5(loginInfo.ha)) {
				await completeLogin(res, loginInfo);
				return resolve("/?p=107");
			}
			else return resolve("/?p=100&e=0");
		} else {
			crypto.pbkdf2(md5(loginInfo.ha), dbInfo.password_salt, config.database.pbkdf2.itterations, config.database.pbkdf2.keylength, "sha512", async (err, derivedKey) => {
				if (err) {
					console.error(err);
					return resolve("/?p=100&e=1");
				} else {
					if (derivedKey.toString("hex") !== dbInfo.password_hash)
						return resolve("/?p=100&e=0");

					await completeLogin(res, loginInfo);

					return resolve("/?=0");
				}
			});
		}
	});
}

async function completeLogin(res, loginInfo) {
	const sessionToken = crypto.randomBytes(32).toString("hex");
	await global.Database.query("UPDATE users_info SET web_session = ? WHERE username = ?", [sessionToken, loginInfo.u]);
	res.cookie("binato_session", sessionToken, {maxAge:2147483647});
}