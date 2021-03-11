const md5 = require("md5"),
      {v4: uuid} = require("uuid");

module.exports = async function(loginInfo, res) {
    const dbInfo = await global.Database.query(`SELECT id, password, password_change_required FROM users_info WHERE username = "${loginInfo.u}" LIMIT 1`);

    if (dbInfo == null) return "/?p=100&e=0";

    if (loginInfo.ha == "") return "/?p=100&e=0"

    const sessionToken = uuid().split("-").join("") + uuid().split("-").join("");

    // Should aes the passwords just leaving md5 hashes of passwords in the database is *stupidly* unsafe
    if (dbInfo.password === md5(loginInfo.ha)) {
        await global.Database.query(`UPDATE users_info SET web_session = "${sessionToken}" WHERE username = "${loginInfo.u}"`);
        res.cookie("binato_session", sessionToken, {maxAge:2147483647});
        if (dbInfo.password_change_required == 1) return "/?p=106";
        else return "/?p=0";
    }
    else return "/?p=100&e=0";
}