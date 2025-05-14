const success = Buffer.from("User updated successfully").toString("base64url");
const Permissions = require("./enums/Permissions.js");

module.exports = function(body, req, res) {
	return new Promise(async (resolve, reject) => {
		if (req.user == null) {
			return resolve("/?p=0");
		}
		// Construct flags from switches
		let flags = 0;
		if (body.bat) {
			flags += Permissions.BAT;
		}
		if (body.supporter) {
			flags += Permissions.Supporter;
		}
		if (body.peppy) {
			flags += Permissions.Peppy;
		}
		if (body.tournament) {
			flags += Permissions.Tournament;
		}
		if (body.bot) {
			flags += Permissions.Bot;
		}
		if (body.moderator) {
			flags += Permissions.Moderator;
		}
		if (body.admin) {
			flags += Permissions.Admin;
		}

		await global.Database.query("UPDATE users_info SET username = ?, username_safe = ?, email = ?, country = ?, tags = ?, verification_needed = ?, last_modified_time = CURRENT_TIMESTAMP() WHERE id = ?", [
			body.username, body.username.toLowerCase().split(" ").join("_"),
			body.email, body.country.toLowerCase(), flags, body.verification === "true",
			body.id
		]);

		resolve(`/?p=911&u=${body.id}&alert=${success}`);
	});
}