const md5 = require("md5"),
	  config = require("./config.json"),
	  crypto = require("crypto");

module.exports = function(passwdInfo, req, res) {
	return new Promise((resolve, reject) => {
		if (req.user != null) {
			if (passwdInfo.ha.length > 100 || passwdInfo.cha.length > 100) return resolve("/?p=106&e=1");

			if (passwdInfo.ha === passwdInfo.cha) {
				crypto.randomBytes(32, (err, sessionToken) => {
					if (err) {
						console.error(err);
						return resolve("/?p=106&e=1");
					}
					sessionToken = sessionToken.toString("hex");

					crypto.randomBytes(128, (err, passwordSalt) => {
						if (err) {
							console.error(err);
							return resolve("/?p=106&e=1");
						}
						passwordSalt = passwordSalt.toString("hex");

						crypto.pbkdf2(md5(passwdInfo.ha), passwordSalt, config.database.pbkdf2.itterations, config.database.pbkdf2.keylength, "sha512", async (err, derivedKey) => {
							if (err) {
								console.error(err);
								return resolve("/?p=106");
							} else {
								await global.Database.query(
									"UPDATE users_info SET password_hash = ?, password_salt = ?, password_change_required = ?, has_old_password = ?, password_reset_key = ?, web_session = ? WHERE id = ?",
									[derivedKey.toString("hex"), passwordSalt, 0, 0, null, sessionToken, req.user.id]
								);
								res.cookie("binato_session", sessionToken, {maxAge:2147483647});
								if (req.user.password_change_required == 1) return resolve(`/?p=0`);
								else return resolve(`/?p=105`);
							}
						});
					});
				});
			} else return resolve(`/?p=106&e=0`);
		} else {
			return resolve(`/?p=0`);
		}
	});
}