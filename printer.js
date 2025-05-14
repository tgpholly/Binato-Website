const config = require("./config.json"),
	  flagConversion = require("./flagConversion.json");

const bitFlags = require("./bitflags.js");
const Permissions = require("./enums/Permissions.js");

module.exports.page = async function(pid, req, res) {
	pid = pid == null ? 0 : parseInt(pid);
	
	// Remind me to never do this again. wtf is a genericVariable?
	let pageUser, genericVariable, genericVariable1, genericVariable2, genericVariable3, friends, userRank, gameMode, webPrefs;

	if (req.user != null) {
		if ((req.user.password_change_required == 1 && req.user.has_old_password == 0) && pid != 107) {
			res.redirect(303, "/?p=107");
			return null;
		}
		if (req.user.has_old_password >= 1 && pid != 107) {
			res.redirect(303, "/?p=107");
			return null;
		}
		if (pid >= 900 && req.user.id != 2) {
			res.redirect(303, "/");
			return null;
		}
	} else {
		if (pid == 105 || pid == 106 || pid == 107 || pid >= 900) {
			res.redirect(303, "/");
			return null;
		}
	}

	switch (pid) {
		case 0:
			genericVariable = await global.Database.query(`SELECT HomepageText from web_info LIMIT 1`);
			return `
				<div style="text-align:center">
					${genericVariable["HomepageText"]}
				</div>
			`;

		case 1:
			pageNumber = parseInt(req.query.page);
			pageIsNaN = isNaN(pageNumber);
			if (pageIsNaN) {
				pageNumber = 0;
			}

			dbPage = pageNumber * 50;
			pageCount = calculatePageCount((await global.Database.query("SELECT COUNT(id) FROM users_info"))[0]["COUNT(id)"], 50);

			if (req.query.t == null || req.query.t == 0) genericVariable = await global.Database.query("SELECT user_id, ranked_score, pp_raw FROM users_modes_info WHERE mode_id = ? AND is_deleted <> 1 AND ranked_score <> 0 AND pp_raw <> 0 ORDER BY pp_raw DESC LIMIT 50 OFFSET ?", [req.query.m == null ? 0 : req.query.m, dbPage]);
			else genericVariable = await global.Database.query("SELECT user_id, ranked_score, pp_raw FROM users_modes_info WHERE mode_id = ? AND is_deleted <> 1 AND ranked_score <> 0 AND pp_raw <> 0 ORDER BY ranked_score DESC LIMIT 50 OFFSET ?", [req.query.m == null ? 0 : req.query.m, dbPage]);

			genericVariable1 = "";
			leaderboardPageCount = 1;

			parsedModeId = parseInt(req.query.m);
			modeIsNaN = isNaN(parsedModeId);
			if (modeIsNaN) {
				parsedModeId = 0;
			}

			for (let i = 0; i < genericVariable.length; i++) {
				genericVariable2 = await global.Database.query(`SELECT username, country FROM users_info WHERE id = ? AND is_deleted <> 1 LIMIT 1`, [genericVariable[i].user_id]);

				genericVariable3 = flagConversion[genericVariable2.country];
				genericVariable1 += `
					<tr>
						<th>${i + 1}</td>
						<td><a class="text-info" href="/?p=50&u=${genericVariable[i].user_id}&m=${parsedModeId}">${genericVariable2.username}</a> ${genericVariable3 == null ? "" : genericVariable3}</td>
						<td>${addCommas(genericVariable[i].ranked_score)}</td>
						<td>${addCommas(genericVariable[i].pp_raw)}</td>
					</tr>
				`;
			}

			parsedScoringType = parseInt(req.query.t);
			scoringTypeNaN = isNaN(parsedScoringType);
			if (scoringTypeNaN) {
				parsedScoringType = 0
			}

			firstPage = pageNumber == 0;
			lastPage = (pageNumber + 1) == pageCount;

			return `
				<div class="container p-0">
					<div class="row">
						<div class="col">
							<div class="btn-group" role="group" aria-label="Mode Selection">
								<a class="btn btn-primary${(parsedModeId === 0) ? " active" : ""}" href="/?p=1${(scoringTypeNaN ? "" : "&t=" + parsedScoringType)}&m=0">osu!</a>
								<a class="btn btn-primary${(parsedModeId === 1) ? " active" : ""}" href="/?p=1${(scoringTypeNaN ? "" : "&t=" + parsedScoringType)}&m=1">osu!taiko</a>
								<a class="btn btn-primary${(parsedModeId === 3) ? " active" : ""}" href="/?p=1${(scoringTypeNaN ? "" : "&t=" + parsedScoringType)}&m=3">osu!mania</a>
								<a class="btn btn-primary${(parsedModeId === 2) ? " active" : ""}" href="/?p=1${(scoringTypeNaN ? "" : "&t=" + parsedScoringType)}&m=2">osu!catch</a>
							</div>
						</div>
						<div class="col">
							<div class="btn-group mb-3" role="group" aria-label="Ranking Type Selection">
								<a class="btn btn-primary${(parsedScoringType === 0) ? " active" : ""}" href="/?p=1${modeIsNaN ? "" : "&m=" + parsedModeId}">PP</a>
								<a class="btn btn-primary${(parsedScoringType === 1) ? " active" : ""}" href="/?p=1&t=1${modeIsNaN ? "" : "&m=" + parsedModeId}">Score</a>
							</div>
						</div>
						<div class="col">
							<div class="btn-group mb-3" role="group" aria-label="Ranking Type Selection">
								<a class="btn btn-primary${firstPage ? " disabled" : ""}"${firstPage ? "" : `href="/?p=1${(scoringTypeNaN ? "" : "&t=" + parsedScoringType)}${modeIsNaN ? "" : "&m=" + parsedModeId}&page=${pageNumber - 1}"`}>&lt;</a>
								<a class="btn btn-primary no-click">${pageNumber + 1}/${pageCount}</a>
								<a class="btn btn-primary${lastPage ? " disabled" : ""}"${lastPage ? "" : `href="/?p=1${(scoringTypeNaN ? "" : "&t=" + parsedScoringType)}${modeIsNaN ? "" : "&m=" + parsedModeId}&page=${pageNumber + 1}"`}>&gt;</a>
							</div>
						</div>
					</div>
				</div>

				<table class="table table-dark table-striped text-light mb-3" style="margin-bottom:0">
					<thead>
						<tr>
							<th>#</th>
							<th>Player</th>
							<th>Ranked Score</th>
							<th>PP</th>
						</tr>
					</thead>
					<tbody>
						${genericVariable1}
					</tbody>
				</table>
			`;

		case 5:
			// Currently unused page, server switcher hasn't been made and is pretty redundant. See: -devserver arg
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
					if (isNaN(genericVariable)) {
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
						<div class="container">
							<div class="row">
								<div class="col">
									<img src="${config.profilepicture_url}${pageUser.id}?${pageUser.web_pfp_cacheid}" style="border-radius:.5rem;max-height:10rem">
								</div>
								<div class="col align-self-center">
									<h2 style="margin-top:1rem;">${pageUser.username}<h>S</h>${pageUser["playerFlag"] == null ? "" : pageUser["playerFlag"]}</h2>
									<h4>${pageUser.online_now == 1 ? "Online" : "Offline"}</h4>
								</div>
								<div class="col align-self-center">
									<h1 style="text-align:center">${userRank}</h1>
								</div>
							</div>
						</div>
						<hr>
						<div class="container">
							<div class="row">
								<div class="col">
									<p>Joined: <b>${processRegDate(pageUser.reg_date)}</b></p>
									<p>Last Seen: <b>${pageUser.online_now == 1 ? "Now" : processRegDate(pageUser.last_login_date)}</b></p>
									<p>Plays With: <b>${stringFromInputPrefs(webPrefs)}</b></p>
									<p>Location: <b>${webPrefs.location}</b></p>
									<p>Interests: <b>${webPrefs.interests}</b></p>
								</div>
								<div class="col">
									<div class="row">
										<div class="col">
											<p>Ranked Score</p>
											<p>Hit Accuracy</p>
											<p>Play Count</p>
											<p>Total Score</p>
											<p>Maximum Combo</p>
											<p>PP</p>
										</div>
										<div class="col">
											<p><b>${addCommas(genericVariable == null ? 0 : genericVariable.ranked_score)}</b></p>
											<p><b>${genericVariable == null ? 0 : genericVariable.avg_accuracy.toFixed(2)}%</b></p>
											<p><b>${addCommas(genericVariable == null ? 0 : genericVariable.playcount)}</b></p>
											<p><b>${addCommas(genericVariable == null ? 0 : genericVariable.total_score)}</b></p>
											<p><b>${addCommas(genericVariable1 == null ? 0 : genericVariable1.max_combo)}</b></p>
											<p><b>${addCommas(genericVariable == null ? 0 : genericVariable.pp_raw)}</b></p>
										</div>
									</div>
								</div>
							</div>
						</div>
					`;
				} else throw "User not found";
			} catch (e) {
				if (e == "User not found") {
					return "No user by this ID exists";
				}
			}

		// User stuff

		case 100:
			return `
				<h2>Login</h2>
				<hr>

				<form action="/login" method="post">
					<div class="container">
						<div class="row">
							<div class="col col-sm-3"></div>
							<div class="col">
								<div class="mb-2">
									<label for="usernameBox" class="form-label">Username</label>
									<input type="text" name="u" class="form-control" id="usernameBox" maxlength="15" placeholder="Username">
								</div>
								<div class="mb-2">
									<label for="passwordBox" class="form-label">Password</label>
									<input type="password" name="ha" class="form-control" id="passwordBox" maxlength="100" placeholder="Password">
								</div>
								<br>
								<div class="text-center">
									<input type="submit" class="btn btn-primary" value="Login">
								</div>
							</div>
							<div class="col col-sm-3"></div>
						</div>
					</div>
				</form>

				<hr>
				<center>
					<a href="/?p=101">Don't have an account? Click here!</a>
				</center>
			`;

		case 101:
			return `
				<h2>Register</h2>
				<hr>

				<form action="/register" method="post">
					<div class="container">
						<div class="row">
							<div class="col col-sm-3"></div>
							<div class="col">
								<div class="mb-2">
									<label for="usernameBox" class="form-label">Username</label>
									<input class="form-control" type="text" name="u" id="usernameBox" maxlength="15" placeholder="Username">
								</div>
								<div class="mb-2">
									<label for="emailBox" class="form-label">Email</label>
									<input class="form-control" type="email" name="em" id="emailBox" maxlength="100" placeholder="Email"><br>
								</div>
								<div class="mb-2">
									<label for="passwordBox" class="form-label">Password</label>
									<input class="form-control mb-2" type="password" name="ha" id="passwordBox" maxlength="100" placeholder="Password">
									<input class="form-control" type="password" name="cha" placeholder="Confirm Password">
								</div>
								<br>
								<div class="text-center">
									<input type="submit" class="btn btn-primary" value="Register">
								</div>
							</div>
							<div class="col col-sm-3"></div>
						</div>
					</div>					
				</form>

				<hr>
				<center>
					<a href="/?p=100">Already have an account? Click here!</a>
				</center>
			`;

		// Verification
		case 102:
			return `
			
			`;

		case 105:
			webPrefs = await global.Database.query(`SELECT * FROM web_prefs WHERE id = ? LIMIT 1`, [req.user.id]);

			return `
				<div class="container">
					<div class="row bottom-border">
						<div class="col-4 p-3 bg-dark">
							<b>Account Management</b>
						</div>
						<div class="col p-3">
							<div class="row text-center">
								<div class="col">
									<a class="btn btn-primary" href="/?p=106">Change Password</a>
								</div>
								<div class="col">
									<a class="btn btn-primary" href="javascript:alert('2FA is not currently implemented')">Setup 2FA</a>
								</div>
							</div>
						</div>
					</div>
					<div class="row bottom-border">
						<div class="col-4 p-3 bg-dark">
							<b>Avatar</b>
						</div>
						<div class="col p-3">
							<div class="row text-center">
								<div class="col">
									<img src="${config.profilepicture_url}${req.user.id}?${req.user.web_pfp_cacheid}" style="height:10rem;border-radius:4px">
								</div>
								<div class="col">
									<a class="btn btn-primary" href="/?p=108">Change Profile Picture</a>
								</div>
							</div>
						</div>
					</div>
					<div class="row bottom-border">
						<div class="col-4 p-3 bg-dark">
							<b>Input Methods</b>
						</div>
						<div class="col p-3">
							<form action="/update_settings" method="post">
								<div class="row">
									<div class="col">
										<input class="form-check-input" name="keyboard" id="keyboardCheckbox" type="checkbox"${webPrefs.keyboard == 1 ? " checked" : ""}>
										<label for="keyboardCheckbox">Keyboard</label>
									</div>
									<div class="col">
										<input class="form-check-input" name="mouse" id="mouseCheckbox" type="checkbox"${webPrefs.mouse == 1 ? " checked" : ""}>
										<label for="mouseCheckbox">Mouse</label>
									</div>
								</div>
								<div class="row pt-3">
									<div class="col">
										<input class="form-check-input" name="tablet" id="tabletCheckbox" type="checkbox"${webPrefs.tablet == 1 ? " checked" : ""}>
										<label for="tabletCheckbox">Tablet</label>
									</div>
									<div class="col">
										<input class="form-check-input" class="right" id="touchCheckbox" name="touch" type="checkbox"${webPrefs.touch == 1 ? "checked" : ""}>
										<label for="touchCheckbox">Touch</label>
									</div>
								</div>

								<input class="mt-3 btn btn-primary" type="submit" value="Save Changes">
							</form>
						</div>
					</div>
					<div class="row">
						<div class="col-4 p-3 bg-dark">
							<b>Profile Info</b>
						</div>
						<div class="col p-3">
							<form action="/profile_info" method="post">
								<div class="col">
									<label class="pb-1">Location</label>
									<input class="form-control" type="text" name="location" maxlength="32" value="${webPrefs.location.split("\"").join("&quot;").split("<").join("&lt;").split(">").join("&gt;")}"></input>
								</div>
								<div class="col">
									<label class="pb-1 pt-1">Interests</label>
									<input class="form-control" type="text" name="interests" maxlength="64" value="${webPrefs.interests.split("\"").join("&quot;").split("<").join("&lt;").split(">").join("&gt;")}"></input>
								</div>

								<input class="mt-3 btn btn-primary" type="submit" value="Save Changes">
							</form>
						</div>
					</div>
				</div>
			`;

		case 106:
		case 107:
			return `
				<h2>${pid == 107 ? "Required Password Change" : "Change Password"}</h2>
				<hr>

				<form action="/change_password" method="post">
					<div class="container">
						<div class="row">
							<div class="col col-sm-3"></div>
							<div class="col">
								<div class="mb-2">
									<input type="password" name="ha" class="form-control" maxlength="100" placeholder="Password">
								</div>
								<div class="mb-2">
									<input type="password" name="cha" class="form-control" maxlength="100" placeholder="Confirm Password">
								</div>
								<br>
								<div class="text-center">
									<input type="submit" class="btn btn-primary" value="Change Password">
								</div>
							</div>
							<div class="col col-sm-3"></div>
						</div>
					</div>
				</form>

				${pid == 107 ? "" : `<hr>
				<center>
					<a href="/?p=105">I don't want to do this, take me back!</a>
				</center>`}
			`;

		case 108:
			return `
				<script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.js" integrity="sha512-ooSWpxJsiXe6t4+PPjCgYmVfr1NS5QXJACcR/FPpsdm6kqG1FmQ2SVyg2RXeVuCRBLr0lWHnWJP6Zs1Efvxzww==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
				<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css" integrity="sha512-0SPWAwpC/17yYyZ/4HSllgaK7/gg9OlVozq8K7rf3J8LvCjYEEIfzzpnA2/SSjpGIunCSD18r3UhvDcu/xncWA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
				<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cropper/1.0.1/jquery-cropper.min.js" integrity="sha512-V8cSoC5qfk40d43a+VhrTEPf8G9dfWlEJgvLSiq2T2BmgGRmZzB8dGe7XAABQrWj3sEfrR5xjYICTY4eJr76QQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>

				<div>
					<input style="margin-bottom:1rem!important" type="file" class="form-control" id="imagePicker" accept="image/*" />
					
					<div id="fpContainer" style="margin-bottom:1rem!important">
						<center id="centerlol">
							<img id="image" src="${config.profilepicture_url}${req.user.id}?${req.user.web_pfp_cacheid}" style="max-width:100%">
						</center>
					</div>

					<center id="uploadButton" style="display:none"><button class="btn btn-primary" id="submitButton" disabled>Upload</button></center>
				</div>

				<script src="/js/pfp.js"></script>
			`;

		// Admin panel 900 - 999
		case 900:
			return `
				
			`;

		// 910 - 919 User management
		case 910:
			pageNumber = parseInt(req.query.page);
			pageIsNaN = isNaN(pageNumber);
			if (pageIsNaN) {
				pageNumber = 0;
			}

			dbPage = pageNumber * 50;
			pageCount = calculatePageCount((await global.Database.query("SELECT COUNT(id) FROM users_info"))[0]["COUNT(id)"], 50);

			genericVariable = await global.Database.query("SELECT id, username, country FROM users_info LIMIT 50 OFFSET ?", [dbPage]);

			genericVariable1 = "";
			leaderboardPageCount = 1;

			let usernameList = "";

			for (let i = 0; i < genericVariable.length; i++) {
				usernameList += `"${genericVariable[i].id}":"${genericVariable[i].username}",`;
				genericVariable1 += `
					<tr>
						<form id="deleteForm${genericVariable[i].id}" action="/delete_user" method="post"><input style="display:none" name="id" value="${genericVariable[i].id}"></form>
						<th>${genericVariable[i].id}</td>
						<td>${genericVariable[i].username}</td>
						<td>${genericVariable[i].country.toUpperCase()}</td>
						<td><button onclick="doDelete('${genericVariable[i].id}')" class="btn btn-danger btn-sm ms-2 float-end"><i class="bi bi-trash"></i></button><a class="btn btn-warning btn-sm ms-2 float-end"><i class="bi bi-arrow-clockwise"></i></a><a class="btn btn-info btn-sm ms-2 float-end" href="/?p=911&u=${genericVariable[i].id}"><i class="bi bi-pencil-square"></i></a></td>
					</tr>
				`;
			}

			parsedModeId = parseInt(req.query.m);
			modeIsNaN = isNaN(parsedModeId);
			if (modeIsNaN) {
				parsedModeId = 0;
			}

			parsedScoringType = parseInt(req.query.t);
			scoringTypeNaN = isNaN(parsedScoringType);
			if (scoringTypeNaN) {
				parsedScoringType = 0
			}

			firstPage = pageNumber == 0;
			lastPage = (pageNumber + 1) == pageCount;

			// User listing
			return `
				<table class="table table-dark table-striped text-light mb-3" style="margin-bottom:0">
					<thead>
						<tr>
							<th>ID</th>
							<th>Username</th>
							<th>Country</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						${genericVariable1}
					</tbody>
				</table>
				
				<script>
					let users = {${usernameList}};
					function doDelete(which) {
						if (!confirm('Are you sure you wish to delete ' + users[which] + '?')) {
							return;
						}

						const delForm = document.getElementById("deleteForm"+which);
						delForm.submit();
					}
				</script>
			`;

		case 911:
			userId = parseInt(req.query.u);
			if (isNaN(userId))
				return "User Editor | ID must be given";

			dbData = await global.Database.query("SELECT * FROM users_info WHERE id = ? LIMIT 1", [userId]);
			if (dbData == null) {
				return "User Editor | ID does not correspond to a User";
			} else {
				flags = bitFlags(dbData.tags, Permissions);

				return `
					${req.query.alert != null ? `
						<div class="alert alert-info" role="alert" id="pagealert">
							${Buffer.from(req.query.alert, "base64url").toString("utf-8")}
						</div>
					` : ""}
					<h2>Editing ${dbData.username}</h2>
					<hr>
					<form method="post" action="/save_user">
						<input type="hidden" name="id" value="${dbData.id}">
						<label class="mb-2" for="e">Username</label>
						<input class="form-control" name="username" value="${dbData.username.replaceAll("\"","\\\"")}" required>
						<label class="mb-2 mt-1" for="e">Email</label>
						<input class="form-control" name="email" value="${dbData.email.replaceAll("\"","\\\"")}" required>
						<label class="mb-2 mt-1" for="e">Country</label>
						<input class="form-control" name="country" value="${dbData.country.replaceAll("\"","\\\"").toUpperCase()}" required>
						<label class="mb-1 mt-1">Permissions</label><br>
						<div class="form-check form-check-inline form-switch">
							<label class="form-check-label" for="batSwitch">BAT</label>
							<input class="form-check-input" type="checkbox" role="switch" id="batSwitch" name="bat" value="true"${flags[Permissions.BAT] ? " checked" : ""}/>
						</div>
						<div class="form-check form-check-inline form-switch">
							<label class="form-check-label" for="supporterSwitch">Supporter</label>
							<input class="form-check-input" type="checkbox" role="switch" id="supporterSwitch" name="supporter" value="true"${flags[Permissions.Supporter] ? " checked" : ""}/>
						</div>
						<div class="form-check form-check-inline form-switch">
							<label class="form-check-label" for="peppySwitch">Peppy</label>
							<input class="form-check-input" type="checkbox" role="switch" id="peppySwitch" name="peppy" value="true"${flags[Permissions.Peppy] ? " checked" : ""}/>
						</div>
						<div class="form-check form-check-inline form-switch">
							<label class="form-check-label" for="tournamentSwitch">Tournament</label>
							<input class="form-check-input" type="checkbox" role="switch" id="tournamentSwitch" name="tournament" value="true"${flags[Permissions.Tournament] ? " checked" : ""}/>
						</div>
						<div class="form-check form-check-inline form-switch">
							<label class="form-check-label" for="botSwitch">Bot</label>
							<input class="form-check-input" type="checkbox" role="switch" id="botSwitch" name="bot" value="true"${flags[Permissions.Bot] ? " checked" : ""}/>
						</div>
						<div class="form-check form-check-inline form-switch">
							<label class="form-check-label" for="moderatorSwitch">Moderator</label>
							<input class="form-check-input" type="checkbox" role="switch" id="moderatorSwitch" name="moderator" value="true"${flags[Permissions.Moderator] ? " checked" : ""}/>
						</div>
						<div class="form-check form-check-inline form-switch">
							<label class="form-check-label" for="adminSwitch">Admin</label>
							<input class="form-check-input" type="checkbox" role="switch" id="adminSwitch" name="admin" value="true"${flags[Permissions.Admin] ? " checked" : ""}/>
						</div>
						<br>
						<label class="mb-1 mt-1">Account Flags</label><br>
						<div class="form-check form-switch">
						<label class="form-check-label" for="verificationSwitch">Verification Required</label>
							<input class="form-check-input" type="checkbox" role="switch" id="verificationSwitch" name="verification" value="true"${dbData.verification_needed ? " checked" : ""}/>
						</div>
						<input class="btn btn-success mt-3" type="submit" value="Save" />
						<a class="btn btn-danger mt-3 ms-2" href="/?p=910">Cancel</a>
					</form>

					<script>
						setTimeout(() => {
							$("#pagealert").fadeOut("slow");
						}, 5000);
					</script>
				`;
			}

		default:
			return `
				404 | Binato-Website
			`
	}
}

module.exports.nav = async function(pid, user = null) {
	pid = pid == null ? 0 : parseInt(pid);

	if (pid == 106 || pid == 107) {
		return "";
	}

	let navbar = `
<nav class="navbar sticky-top navbar-expand-lg navbar-dark bg-dark">
	<div class="container-fluid">
		<a class="navbar-brand" href="/?p=900">${pid >= 900 ? "Binato Admin Panel" : "Binato"}</a>
		<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#theNavbar" aria-controls="theNavbar" aria-expanded="false" aria-label="Toggle navigation">
			<span class="navbar-toggler-icon"></span>
		</button>
		<div class="collapse navbar-collapse" id="theNavbar">
			<div class="navbar-nav me-auto mb-2 mb-lg-0">`;

	// Left side
	if (pid >= 900) {
		navbar += adminPanelNavbar(pid);
	} else {
		navbar += normalNavbar(pid);
	}

	navbar += `</div><div class="navbar-nav ml-auto">`;

	navbar += `<a class="nav-link mode-switcher-container" href="#" onclick="switchModes()"><i class="bi bi-moon-fill mode-switcher-icon mode-switcher-dark"></i><i class="bi bi-brightness-high-fill mode-switcher-icon mode-switcher-light"></i></a>`;

	if (user != null) {
		// User button
		navbar += `
			<div class="nav-item dropdown">
				<img class="nav-link dropdown-toggle p-0 pfp-border" style="max-height:2.75rem;border-radius:.5rem;width:44px;height:44px" id="profileDropdownButton" data-bs-toggle="dropdown" src="${config.profilepicture_url}${user.id}?${user.web_pfp_cacheid}">
				<div class="dropdown-menu mt-2 dropdown-menu-end bg-dark" aria-labelledby="profileDropdownButton">
					<a class="dropdown-item text-light" href="/?p=50&u=${user.id}&m=0">My Profile</a>
					<a class="dropdown-item text-light" href="/?p=105">Settings</a>${(user.id === 2) ? `<a class="dropdown-item text-light" href="/?p=900">Admin Panel</a>` : ""}
					<a class="dropdown-item text-light" href="javascript:l()">Logout</a>
				</div>
			</div>
		`;
	} else {
		// Login button
		if (pid == 100) navbar += `<a class="nav-link active">Login</a>`;
		else navbar += `<a class="nav-link" href="/?p=100">Login</a>`;
	}

	navbar += "</div></div></div>";

	navbar += "</nav>";

	return navbar;
}

function normalNavbar(pid) {
	let navbar = "<div class=\"nav-item\">";

	if (pid == 0) navbar += `<a class="nav-link active">Home</a>`;
	else navbar += `<a class="nav-link" href="/?p=0">Home</a>`;

	navbar += `</div><div class="nav-item">`;

	if (pid == 1) navbar += `<a class="nav-link active">Leaderboard</a>`;
	else navbar += `<a class="nav-link" href="/?p=1">Leaderboard</a>`;

	navbar += `</div>`;

	navbar += `<div class="nav-item"><a class="nav-link" href="https://github.com/tgpethan/Binato-Repos/" target="_blank">Open Source</a></div>`;

	return navbar;
}

function adminPanelNavbar(pid) {
	let navbar = "<div class=\"nav-item\">";

	if (pid == 900) navbar += `<a class="nav-link active">Dashboard</a>`;
	else navbar += `<a class="nav-link" href="/?p=900">Dashboard</a>`;

	navbar += `</div><div class="nav-item">`;

	if (pid == 910) navbar += `<a class="nav-link active">User Management</a>`;
	else navbar += `<a class="nav-link" href="/?p=910">User Management</a>`;

	navbar += `</div>`;

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

function calculatePageCount(numberOfItems = 0, itemsPerPage = 50) {
	if (typeof(numberOfItems) === "bigint") {
		numberOfItems = Number(numberOfItems);
	}
	const int = Math.floor(numberOfItems / itemsPerPage);
	if (numberOfItems > int) {
		return int + 1;
	} else {
		return int;
	}
}

function processRegDate(d) {
	d = `${d}`.split(" ");
	return `${monthTable[d[1]]} ${d[3]}`
}

function stringFromInputPrefs(webPrefs) {
	return `${webPrefs.keyboard == 1 ? "Keyboard, " : ""}${webPrefs.mouse == 1 ? "Mouse, " : ""}${webPrefs.tablet == 1 ? "Tablet, " : ""}${webPrefs.touch == 1 ? "Touch, " : ""}`.slice(0, -2);
}
