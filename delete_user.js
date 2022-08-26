const {v4: uuid} = require("uuid");

module.exports = async function(delete_info, req, res) {
	if (req.user != null) {
		if (req.user.id != 2) {
			console.warn(`Warning! User ${req.user.username} tried to use delete_user`);
			return "/?p=0";
		}

		const id = parseInt(delete_info.id);

		console.log(id);

		await global.Database.query("DELETE FROM users_info WHERE id = ?", [id]);
		await global.Database.query("DELETE FROM users_modes_info WHERE user_id = ?", [id]);
		await global.Database.query("DELETE FROM users_relationships WHERE user1 = ? OR user2 = ?", [id, id]);
		await global.Database.query("DELETE FROM web_prefs WHERE id = ?", [id]);
		await global.Database.query("DELETE FROM scores WHERE userid = ?", [id]);
		await global.Database.query("DELETE FROM scores_relax WHERE id = ?", [id]);
		
		return "/?p=910";
	}
	else return "/?p=0";
}