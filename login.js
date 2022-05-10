const md5 = require("md5"),
	  aes256 = require("aes256"),
	  {v4: uuid} = require("uuid"),
	  config = require("./config.json");

module.exports = async function(loginInfo, res) {
	const dbInfo = await global.Database.query("SELECT id, password, password_change_required, has_old_password FROM users_info WHERE username = ? LIMIT 1", [loginInfo.u]);

	if (dbInfo == null) return "/?p=100&e=0";

	if (loginInfo.ha == "") return "/?p=100&e=0"

	console.log("User login: " + loginInfo.u);

	if (dbInfo.has_old_password == 1) {
		if (dbInfo.password === md5(loginInfo.ha)) {
			const sessionToken = uuid().split("-").join("") + uuid().split("-").join("");
			await global.Database.query("UPDATE users_info SET web_session = ? WHERE username = ?", [sessionToken, loginInfo.u]);
			res.cookie("binato_session", sessionToken, {maxAge:2147483647});
			return "/?p=107";
		}
		else return "/?p=100&e=0";
	} else {
		if (aes256.decrypt(config.database.databaseKey, dbInfo.password) === md5(loginInfo.ha)) {
			const sessionToken = uuid().split("-").join("") + uuid().split("-").join("");
			await global.Database.query("UPDATE users_info SET web_session = ? WHERE username = ?", [sessionToken, loginInfo.u]);
			res.cookie("binato_session", sessionToken, {maxAge:2147483647});
			if (dbInfo.password_change_required == 1) return "/?p=106";
			else return "/?p=0";
		}
		else return "/?p=100&e=0";
	}
}