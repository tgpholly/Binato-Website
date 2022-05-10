const aes256 = require("aes256"),
	  md5 = require("md5"),
	  {v4: uuid} = require("uuid"),
	  config = require("./config.json");

module.exports = async function(passwdInfo, req, res) {
	if (req.user != null) {
		if (passwdInfo.ha === passwdInfo.cha) {
			const sessionToken = uuid().split("-").join("") + uuid().split("-").join("");
			await global.Database.query("UPDATE users_info SET password = ? WHERE id = ?", [aes256.encrypt(config.database.databaseKey, md5(passwdInfo.ha)), req.user.id]);
			if (req.user.password_change_required == 1) await global.Database.query("UPDATE users_info SET password_change_required = 0 WHERE id = ?", [req.user.id]);
			if (req.user.has_old_password == 1) await global.Database.query("UPDATE users_info SET has_old_password = 0 WHERE id = ?", [req.user.id]);
			await global.Database.query("UPDATE users_info SET web_session = ? WHERE id = ?", [sessionToken, req.user.id]);
			res.cookie("binato_session", sessionToken, {maxAge:2147483647});
			if (req.user.password_change_required == 1) return `/?p=0`;
			else return `/?p=105`;
		} else return `/?p=106&e=0`;
	} else {
		return `/?p=0`;
	}
}