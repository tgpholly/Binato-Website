const md5 = require("md5"),
      {v4: uuid} = require("uuid");

module.exports = async function(passwdInfo, req, res) {
    if (req.user != null) {
        if (passwdInfo.ha === passwdInfo.cha) {
            const sessionToken = uuid().split("-").join("") + uuid().split("-").join("");
            // Should aes the passwords just leaving md5 hashes of passwords in the database is *stupidly* unsafe
            await global.Database.query(`UPDATE users_info SET password = "${md5(passwdInfo.ha)}" WHERE id = "${req.user.id}"`);
            if (req.user.password_change_required == 1) await global.Database.query(`UPDATE users_info SET password_change_required = 0 WHERE id = ${req.user.id}`);
            await global.Database.query(`UPDATE users_info SET web_session = "${sessionToken}" WHERE id = ${req.user.id}`);
            res.cookie("binato_session", sessionToken, {maxAge:2147483647});
            if (req.user.password_change_required == 1) return `/?p=0`;
            else return `/?p=105`;
        } else return `/?p=106&e=0`;
    } else {
        return `/?p=0`;
    }
}