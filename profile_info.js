module.exports = async function(profileInfo, req, res) {
	if (req.user != null) {
		const location = profileInfo["location"].split("\"").join("&quot;").split("<").join("&lt;").split(">").join("&gt;"),
			  interests = profileInfo["interests"].split("\"").join("&quot;").split("<").join("&lt;").split(">").join("&gt;");
		
		await global.Database.query(`UPDATE web_prefs SET location = ?, interests = ? WHERE id = ?`, [location, interests, req.user.id]);

		return `/?p=105`;
	} else {
		return `/?p=0`;
	}
}