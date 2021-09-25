const app = require("express")(),
      bodyParser = require("body-parser"),
      fs = require("fs"),
      config = require("./config.json"),
      printer = require("./printer.js"),
      login = require("./login.js"),
      register = require("./register.js"),
      update_settings = require("./update_settings.js"),
      change_password = require("./change_password.js"),
      DatabaseHelper = require("./DatabaseHelper.js");

global.Database = new DatabaseHelper(config.database.databaseAddress, config.database.databasePort, config.database.databaseUsername, config.database.databasePassword, config.database.databaseName);

app.use(bodyParser.urlencoded({
    extended: true
}));

app.get("*", async (req, res) => {
    const cleanUrl = req.url.split("?")[0];
    if (cleanUrl == "/" || cleanUrl == "/index") {
        const pageConstructStartTime = new Date().getTime();

        req.cookie = cookieParser(req);
        req.cookieKeys = Object.keys(req.cookie);

        if (req.cookie != null && req.cookieKeys.includes("binato_session")) {
            req.user = await global.Database.query(`SELECT * FROM users_info WHERE web_session = "${req.cookie["binato_session"]}" LIMIT 1`);
        }

        const generatedContent = await printer.page(req.query.p, req, res);

        if (generatedContent == null) return;

        const preExistingTitle = generatedContent.includes("<title>");

        // Headers
        res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        res.set("X-XSS-Protection", "1; mode=block");
        res.set("Feature-Policy", "fullscreen 'none'");
        res.set("Permissions-Policy", "microphone=(), geolocation=(), magnetometer=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=()");
        res.set("Referrer-Policy", "strict-origin-when-cross-origin");
        res.set("Content-Security-Policy", "block-all-mixed-content;frame-ancestors 'self'");
        res.set("X-Frame-Options", "SAMEORIGIN");
        res.set("X-Content-Type-Options", "nosniff");
        res.set("X-Powered-By", "Binato-Website");

        if (generatedContent != null) {
            res.send(`
                <html>
                    <head>
                        ${preExistingTitle ? "" : `<title>${await getPageTitle(req.query.p)} - Binato</title>`}
                        <link rel="stylesheet" type="text/css" href="/binato.css" />
                    
                        <!-- Dummy script for firefox layout white flashes -->
                        <script>0</script>
                    </head>
                	<body>
                        ${await printer.nav(req.query.p, req.user)}
                        <div class="container">
                            ${generatedContent}
                        </div>

                        <script>
                            function l() {
                                document.cookie='binato_session=; Max-Age=-99999999;';
                                window.location.href = "/?p=0";
                            }
                        </script>
                    </body>
                </html>
            `);
        }
        console.log(`Finished generating page, took ${new Date().getTime() - pageConstructStartTime}ms`);
    } else {
        fs.access(`${__dirname}/files${req.url}`, fs.F_OK, (err) => {
            if (!err) res.sendFile(`${__dirname}/files${req.url}`);
            else res.status(404).end("404 | Binato-Website");
        });
    }
});

app.post("*", async (req, res) => {
    req.url = req.url.split("?")[0];

    req.cookie = cookieParser(req);
    req.cookieKeys = Object.keys(req.cookie);

    if (req.cookie != null && req.cookieKeys.includes("binato_session")) {
        req.user = await global.Database.query(`SELECT * FROM users_info WHERE web_session = "${req.cookie["binato_session"]}" LIMIT 1`);
    }

    switch (req.url) {
        case "/login":
            return res.redirect(303, await login(req.body, res));

        case "/register":
            return res.redirect(303, await register(req.body, req, res));

        case "/update_settings":
            return res.redirect(303, await update_settings(req.body, req, res));

        case "/change_password":
            return res.redirect(303, await change_password(req.body, req, res));
    }
});

app.listen(config.port, () => console.log(`Listening at port ${config.port}`));

async function getPageTitle(pid = 0) {
    const dbTitle = await global.Database.query(`SELECT title FROM web_titles WHERE id = ${pid} LIMIT 1`);
    if (dbTitle == null) return "Error";
    else return dbTitle["title"];
}

function cookieParser(req) {
    let cookies = req.headers.cookie, cookiesOut = {};
    if (cookies != null) {
        for (let cookie of cookies.split("; ")) {
            cookie = cookie.split("=");
            cookiesOut[cookie[0]] = cookie[1];
        }
        return cookiesOut;
    }
    else return {};
}