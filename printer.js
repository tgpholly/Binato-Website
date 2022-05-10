const config = require("./config.json"),
	  flagConversion = require("./flagConversion.json");

module.exports.page = async function(pid, req, res) {
	pid = pid == null ? 0 : parseInt(pid);
	
	// Remind me to never do this again. wtf is a genericVariable what was I thinking?
	let pageUser, genericVariable, genericVariable1, genericVariable2, genericVariable3, friends, userRank, gameMode, webPrefs;

	if (req.user != null) {
		if ((req.user.password_change_required == 1 && req.user.has_old_password == 0) && pid != 107) {
			res.redirect(303, "/?p=107");
			return null;
		}
		if (req.user.has_old_password == 1 && pid != 107) {
			res.redirect(303, "/?p=107");
			return null;
		}
	} else {
		if (pid == 105 || pid == 106 || pid == 107) {
			res.redirect(303, "/?=0");
			return null;
		}
	}

	switch (pid) {
		case 0:
			genericVariable = await global.Database.query(`SELECT HomepageText from web_info LIMIT 1`);
			return `
				<div class="homeText">
					${genericVariable["HomepageText"]}
				</div>
			`;

		case 1:
			if (req.query.t == null || req.query.t == 0) genericVariable = await global.Database.query("SELECT user_id, ranked_score, pp_raw FROM users_modes_info WHERE mode_id = ? ORDER BY pp_raw DESC LIMIT 50", [req.query.m == null ? 0 : req.query.m]);
			else genericVariable = await global.Database.query("SELECT user_id, ranked_score, pp_raw FROM users_modes_info WHERE mode_id = ? ORDER BY ranked_score DESC LIMIT 50", [req.query.m == null ? 0 : req.query.m]);

			genericVariable1 = "";

			for (let i = 0; i < genericVariable.length; i++) {
				// Don't show users who have 0 score
				if (genericVariable[i].ranked_score > 0) {
					genericVariable2 = await global.Database.query(`SELECT username, country FROM users_info WHERE id = ? LIMIT 1`, [genericVariable[i].user_id]);

					if (req.user != null) friends = await global.Database.query(`SELECT * FROM friends WHERE user = ?`, [req.user.id]);

					genericVariable3 = flagConversion[genericVariable2.country];

					if (friends != null) {
						let isFriendsWithViewer = false;
						for (let row of friends) {
							if (row.friendsWith == genericVariable[i].user_id) {
								if (row.user == req.user.id) {
									isFriendsWithViewer = true;
									break;
								}
							}
						}

						genericVariable1 += `
							<tr class="${req.user.id == genericVariable[i].user_id ? "you" : ""}${isFriendsWithViewer ? "friend" : ""}">
								<td>#${i + 1}</td>
								<td><a href="/?p=50&u=${genericVariable[i].user_id}&m=0">${genericVariable2.username}</a><h>S</h>${genericVariable3 == null ? "" : genericVariable3}</td>
								<td>${addCommas(genericVariable[i].ranked_score)}</td>
								<td>${addCommas(genericVariable[i].pp_raw)}</td>
							</tr>
						`;
					} else {
						genericVariable1 += `
							<tr>
								<td>#${i + 1}</td>
								<td><a href="/?p=50&u=${genericVariable[i].user_id}&m=0">${genericVariable2.username}</a><h>S</h>${genericVariable3 == null ? "" : genericVariable3}</td>
								<td>${addCommas(genericVariable[i].ranked_score)}</td>
								<td>${addCommas(genericVariable[i].pp_raw)}</td>
							</tr>
						`;
					}
				}
			}

			return `
				<table>
					<tr>
						<th>Rank</th>
						<th>Player</th>
						<th>Ranked Score</th>
						<th>PP</th>
					</tr>
					${genericVariable1}
				</table>
			`;

		case 5:
			// Currently unused page, server switcher hasn't been made and is pretty redundant. See: -devserver flag
			return `
				<p>Server Switcher:</p>
				<p>Windows: <a href="/Switcher.exe">Switcher.exe</a></p>
				<p>Linux: <a href="/Switcher">Switcher</a></p>
				<p>Source Code: <a href="https://github.com/tgpethan/Binato-Switcher/">Github</a></p>
			`;

		// Userpage

		case 50:
			try {
				if (req.query.u != null) {
					genericVariable = parseInt(req.query.u);
					if (genericVariable.toString() == "NaN") {
						// Get user from database using a username instead
						pageUser = await global.Database.query("SELECT * FROM users_info WHERE username = ? LIMIT 1", [req.query.u]);
						// Make sure this user exsts
						if (pageUser != null) {
							res.redirect(303, `/?p=50&u=${pageUser.id}&m=0`);
							return null;
						} else throw "User not found";
					}
					// Get user from database by id instead
					else pageUser = await global.Database.query(`SELECT * FROM users_info WHERE id = ? LIMIT 1`, [genericVariable]);

					// Make sure the user exists
					if (pageUser == null) throw "User not found";

					genericVariable = await global.Database.query("SELECT user_id, pp_raw FROM users_modes_info WHERE mode_id = 0 ORDER BY pp_raw DESC");

					for (let i = 0; i < genericVariable.length; i++) {
						if (genericVariable[i]["user_id"] == pageUser.id) {
							userRank = i + 1;
							break;
						}
					}

					userRank = userRank == null ? "Unknown" : `#${userRank}`;

					gameMode = parseInt(req.query.m);
					if (req.query.m == null || gameMode > 3) gameMode = 0;

					genericVariable = await global.Database.query("SELECT * FROM users_modes_info WHERE mode_id = ? AND user_id = ? LIMIT 1", [gameMode, pageUser.id]);
					genericVariable1 = await global.Database.query("SELECT max_combo FROM scores WHERE userid = ? ORDER BY max_combo DESC LIMIT 1", [pageUser.id]);
					webPrefs = await global.Database.query("SELECT * FROM web_prefs WHERE id = ? LIMIT 1", [pageUser.id]);

					pageUser["playerFlag"] = flagConversion[pageUser.country];

					return `
						<title>${pageUser.username} - Binato</title>
						<div class="userpage">
							<div class="userbox">
								<img src="${config.profilepicture_url}${pageUser.id}">
								<h2>${pageUser.username}<h>S</h>${pageUser["playerFlag"] == null ? "" : pageUser["playerFlag"]}</h2>
								<h4>${pageUser.online_now == 1 ? "Online" : "Offline"}</h4>
								<h1>${userRank}</h1>
							</div>
							<div class="userinfo">
								<div class="leftside">
									<p>Joined: <b>${processRegDate(pageUser.reg_date)}</b></p>
									<p>Last Seen: <b>${pageUser.online_now == 1 ? "Now" : processRegDate(pageUser.last_login_date)}</b></p>
									<p>Plays With: <b>${stringFromInputPrefs(webPrefs)}</b></p>
									<p>Location: <b>${webPrefs.location}</b></p>
									<p>Interests: <b>${webPrefs.interests}</b></p>
								</div>
								<div class="rightside">
									<div class="infocontainer">
										<p class="left">Ranked Score</p>
										<p class="right"><b>${addCommas(genericVariable == null ? 0 : genericVariable.ranked_score)}</b></p>
									</div>
									<div class="infocontainer">
										<p class="left">Hit Accuracy</p>
										<p class="right"><b>${genericVariable == null ? 0 : genericVariable.avg_accuracy.toFixed(2)}%</b></p>
									</div>
									<div class="infocontainer">
										<p class="left">Play Count</p>
										<p class="right"><b>${addCommas(genericVariable == null ? 0 : genericVariable.playcount)}</b></p>
									</div>
									<div class="infocontainer">
										<p class="left">Total Score</p>
										<p class="right"><b>${addCommas(genericVariable == null ? 0 : genericVariable.total_score)}</b></p>
									</div>
									<div class="infocontainer">
										<p class="left">Maximum Combo</p>
										<p class="right"><b>${addCommas(genericVariable1 == null ? 0 : genericVariable1.max_combo)}</b></p>
									</div>
									<div class="infocontainer">
										<p class="left">PP</p>
										<p class="right"><b>${addCommas(genericVariable == null ? 0 : genericVariable.pp_raw)}</b></p>
									</div>
								</div>
							</div>
						</div>
					`;
				} else throw "User not found";
			} catch (e) {
				return `There was an error loading the userpage for this user. This has been logged.`;
			}

		// User stuff

		case 100:
			return `
				<div class="loginbox" style="height:290px;">
					<h2>Login</h2>
					<hr>

					<form class="formpositioner" action="/login" method="post">
						<input class="logintext" type="text" name="u" placeholder="Username"><br>
						<input class="logintext" type="password" name="ha" placeholder="Password"><br>
						<br>
						<input class="formsubmitbutton" type="submit" value="Login">
					</form>

					<a class="noaccount" href="/?p=101">Don't have an account? Click here!</a>
				</div>
			`;

		case 101:
			return `
				<div class="loginbox" style="height:376px;">
					<h2>Register</h2>
					<hr>

					<form class="formpositioner" action="/register" method="post">
						<input class="logintext" type="text" name="u" placeholder="Username"><br>
						<input class="logintext" type="text" name="em" placeholder="Email"><br>
						<input class="logintext" type="password" name="ha" placeholder="Password"><br>
						<input class="logintext" type="password" name="cha" placeholder="Confirm Password"><br>
						<br>
						<input class="formsubmitbutton" type="submit" value="Register">
					</form>

					<a class="noaccount" href="/?p=100">Already have an account? Click here!</a>
				</div>
			`;

		// Verification
		case 102:
			return `
			
			`;

		case 105:
			webPrefs = await global.Database.query(`SELECT * FROM web_prefs WHERE id = ? LIMIT 1`, [req.user.id]);

			return `
				<div class="settingspage">
					<div class="userbox" style="height:510px">
						<div class="insetcontainer">
							<p><b>Account Management</b></p>
							<form action="/" method="get">
								<input style="display:none;" type="text" name="p" value="106"></input>
								<input class="button" type="submit" value="Change Password">
							</form>
						</div>
						<div class="insetcontainer" style="top:124px">
							<form action="/update_settings" method="post">
								<p><b>Input Methods</b></p>
								<div class="checkboxcontainer">
									<p class="left">Keyboard</p>
									<input class="right" name="keyboard" type="checkbox"${webPrefs.keyboard == 1 ? " checked" : ""}>
								</div>
								<div class="checkboxcontainer">
									<p class="left">Mouse</p>
									<input class="right" name="mouse" type="checkbox"${webPrefs.mouse == 1 ? " checked" : ""}>
								</div>
								<div class="checkboxcontainer">
									<p class="left">Tablet</p>
									<input class="right" name="tablet" type="checkbox"${webPrefs.tablet == 1 ? " checked" : ""}>
								</div>
								<div class="checkboxcontainer">
									<p class="left">Touch</p>
									<input class="right" name="touch" type="checkbox"${webPrefs.touch == 1 ? "checked" : ""}>
								</div>
								<br>
								<input class="button" type="submit" value="Save Changes">
							</form>
						</div>
						<div class="insetcontainer" style="top:324px">
							<p><b>Profile Info</b></p>
							<form action="/profile_info" method="post">
								<div class="checkboxcontainer">
									<p class="left">Location</p>
									<input class="right" style="width:150px" type="text" name="location" value="${webPrefs.location.split("\"").join("&quot;").split("<").join("&lt;").split(">").join("&gt;")}"></input>
								</div>
								<hr style="margin:2px;visibility:hidden">
								<div class="checkboxcontainer">
									<p class="left">Interests</p>
									<input class="right" style="width:150px" type="text" name="interests" value="${webPrefs.interests.split("\"").join("&quot;").split("<").join("&lt;").split(">").join("&gt;")}"></input>
								</div>
								<br>
								<input class="button" type="submit" value="Save Changes">
							</form>
						</div>
					</div>
				</div>
			`;

		case 106:
			return `
				<div class="loginbox" style="height:290px;">
					<h2>Change Password</h2>
					<hr>

					<form class="formpositioner" action="/change_password" method="post">
						<input class="logintext" type="password" name="ha" placeholder="Password"><br>
						<input class="logintext" type="password" name="cha" placeholder="Confirm Password"><br>
						<br>
						<input class="formsubmitbutton" type="submit" value="Change Password">
					</form>

					<a class="noaccount" href="/?p=105">I don't want to do this, take me back!</a>
				</div>          
			`;

		case 107:
			return `
				<div class="loginbox" style="height:260px;">
					<h2>Required Password Change</h2>
					<hr>

					<form class="formpositioner" action="/change_password" method="post">
						<input class="logintext" type="password" name="ha" placeholder="Password"><br>
						<input class="logintext" type="password" name="cha" placeholder="Confirm Password"><br>
						<br>
						<input class="formsubmitbutton" type="submit" value="Change Password">
					</form>
				</div>          
			`;

		case 199:
			return `
				
			`;

		default:
			return `
				404 | Binato-Website
			`
	}
}

module.exports.nav = async function(pid, user = null) {
	pid = pid == null ? 0 : parseInt(pid);

	let navbar = "<nav>";

	// Left side
	if (pid == 0) navbar += `<a class="button selected">Home</a>`;
	else navbar += `<a class="button" href="/?p=0">Home</a>`;

	if (pid == 1) navbar += `<a class="button selected">Leaderboard</a>`;
	else navbar += `<a class="button" href="/?p=1">Leaderboard</a>`;

	navbar += `<a class="button" href="https://github.com/tgpethan/Binato-Repos/" target="_blank">Open Source</a>`;

	// Right side
	navbar += `<div class="right">`;

	if (user != null) {
		// User button
		navbar += `
			<div class="dropdown">
				<a class="buttonimg"><img height="36" src="${config.profilepicture_url}${user.id}"></a>
				<div class="dropdownContent">
					<a href="/?p=50&u=${user.id}&m=0">My Profile</a>
					<a href="/?p=105">Settings</a>
					<a href="javascript:l()">Logout</a>
				</div>
			</div>
		`;
	} else {
		// Login button
		if (pid == 100) navbar += `<a class="button selected">Login</a>`;
		else navbar += `<a class="button" href="/?p=100">Login</a>`;
	}

	navbar += "</div>";

	navbar += "</nav>";

	return navbar;
}

function addCommas(s = 0) {
	s += '';
	var x = s.split('.');
	var x1 = x[0];
	var x2 = x.length > 1 ? '.' + x[1] : '';
	var regex = /(\d+)(\d{3})/;
	while (regex.test(x1)) x1 = x1.replace(regex, '$1' + ',' + '$2');
	return x1 + x2;
}

const monthTable = {
	Jan: "January",
	Feb: "February",
	Mar: "March",
	Apr: "April",
	May: "May",
	Jun: "June",
	Jul: "July",
	Aug: "August",
	Sep: "September",
	Oct: "October",
	Nov: "November",
	Dec: "December"
}

function processRegDate(d) {
	d = `${d}`.split(" ");
	return `${monthTable[d[1]]} ${d[3]}`
}

function stringFromInputPrefs(webPrefs) {
	return `${webPrefs.keyboard == 1 ? "Keyboard, " : ""}${webPrefs.mouse == 1 ? "Mouse, " : ""}${webPrefs.tablet == 1 ? "Tablet, " : ""}${webPrefs.touch == 1 ? "Touch, " : ""}`.slice(0, -2);
}
