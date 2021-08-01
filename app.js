require("dotenv").config();

const PORT = process.env.PORT || 4500;

const cookieParser = require("cookie-parser");
const express = require("express");
const expressEjsLayouts = require("express-ejs-layouts");
const path = require("path");

const router = require("./src");
const knex = require("./src/config/knex");

//TODO: change to DE in production
const de = require("./src/lang/de");
const en = require("./src/lang/en");

const app = express();

app.set("trust proxy", true);
app.set("view engine", "ejs");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(expressEjsLayouts);

app.use(async (req, _, next) => {
    if (process.env.NODE_ENV === "production") {
        await knex("access_logs").insert({
            user_agent: req.headers["user-agent"],
            page_name: process.env.PAGE_NAME,
            requested_resource: req.path,
            method: req.method,
        });
    }

    return next();
});

app.use("/css", express.static(path.join(__dirname, "./public/css")));
app.use("/assets", express.static(path.join(__dirname, "./public/assets")));

app.use((req, _, next) => {
    const langs = req.acceptsLanguages();

    if (langs[0].includes("de")) {
        req.i18n = {
            ...en,
            ...de,
        };
    } else {
        req.i18n = en;
    }

    return next();
});

app.use("/", router);

app.listen(PORT, () => {
    console.log("Server listening on http://localhost:" + PORT);
});
