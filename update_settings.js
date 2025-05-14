const md5 = require("md5"),
	  {v4: uuid} = require("uuid");

module.exports = async function(update_info, req, res) {
	if (req.user != null) {
		const infoKeys = Object.keys(update_info);

		if (infoKeys.includes("keyboard")) update_info["keyboard"] = 1;
		else update_info["keyboard"] = 0;

		if (infoKeys.includes("mouse")) update_info["mouse"] = 1;
		else update_info["mouse"] = 0;

		if (infoKeys.includes("tablet")) update_info["tablet"] = 1;
		else update_info["tablet"] = 0;

		if (infoKeys.includes("touch")) update_info["touch"] = 1;
		else update_info["touch"] = 0;

		await global.Database.query(`UPDATE web_prefs SET keyboard = ?, mouse = ?, tablet = ?, touch = ? WHERE id = ?`, [
			update_info["keyboard"], update_info["mouse"], update_info["tablet"], update_info["touch"], req.user.id
		]);
		
		return "/?p=105";
	}
	else return "/?p=0";
}