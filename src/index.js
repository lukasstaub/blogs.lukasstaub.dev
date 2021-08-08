const { Router } = require("express");
const Turndown = require("turndown");
const marked = require("marked");
const nodemailer = require("nodemailer");

const knex = require("./config/knex");

const router = Router();

router.get("/", async (req, res) => {
    const service = new Turndown();

    const [row] = await knex("website_config").where("name", "=", "featured_post");
    const [featured] = await knex("blogs").where("id", "=", row.value);

    const newBlogs = await knex("blogs").orderBy("published_at", "desc").whereNotNull("published_at").limit(6);
    const languageBlogs = await knex("blogs").orderBy("published_at", "desc").whereNotNull("published_at").limit(8);
    const blogs = await knex("blogs").select("id", "title", "slug", "published_at").orderBy("published_at", "desc").whereNotNull("published_at").limit(10);

    const categories = await knex("categories").orderBy("name", "asc");

    function shorten(body) {
        const strLength = 450;
        return marked.parse(service.turndown(body).substring(0, strLength) + "...");
    }

    const obj = {};
    languageBlogs.forEach((el) => {
        obj[el.language] = {
            lang: el.language,
            blogs: obj[el.language]
                ? [
                      ...obj[el.language].blogs,
                      {
                          ...el,
                          body: shorten(el.body),
                      },
                  ]
                : [
                      {
                          ...el,
                          body: shorten(el.body),
                      },
                  ],
        };
    });

    const finalNewBlogs = newBlogs.map((el) => ({ ...el, body: shorten(el.body) }));

    return res.render("home", {
        title: req.i18n.title_home,
        i18n: req.i18n,
        newBlogs: finalNewBlogs,
        languageBlogs: Object.keys(obj).map((el) => obj[el]),
        blogs,
        categories,
        featured: featured
            ? {
                  ...featured,
                  body: shorten(featured.body),
              }
            : {},
    });
});

router.get("/:year/:month/:day/:slug", async (req, res) => {
    const [blog] = await knex("blogs").where("slug", "=", req.params.slug);

    if (!blog) return res.status(404).render("404", { title: req.i18n.title_not_found, i18n: req.i18n });

    const comments = await knex("comments").where("blog_id", "=", blog.id).whereNotNull("approved_at");

    return res.render("post", { cookies: req.cookies, i18n: req.i18n, title: blog.title, blog, comments });
});

router.get("/all", async (req, res) => {
    const blogs = await knex("blogs").select("title", "slug", "id", "published_at").whereNotNull("published_at").orderBy("published_at", "desc");

    return res.render("posts", { title: req.i18n.title_all_posts, i18n: req.i18n, contents: blogs, page_title: req.i18n.title_all_posts });
});

router.get("/category", async (req, res) => {
    if (!req.query.id) return res.redirect("/");

    const [category] = await knex("categories").where("id", "=", req.query.id);

    if (!category) return res.render("404", { title: req.i18n.title_not_found, i18n: req.i18n });

    const blogs = await knex("blogs").select("title", "slug", "id", "published_at").whereNotNull("published_at").where("category_id", "=", req.query.id).orderBy("published_at", "desc");

    return res.render("posts", { title: req.i18n.title_posts_for_cat(category.name), i18n: req.i18n, contents: blogs, page_title: category.name });
});

router.post("/comment/:slug", async (req, res) => {
    const { name, email, body } = req.body;

    if (!name || !email || !body) return res.redirect("/");

    const [post] = await knex("blogs").where("slug", "=", req.params.slug);

    if (!post) return res.redirect("/");

    await knex("comments").insert({
        name,
        email,
        body,
        ip: req.ip,
        blog_id: post.id,
    });

    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: 25,
        secure: false,
        auth: {
            user: process.env.MAIL_FROM,
            pass: process.env.MAIL_PW,
        },
    });

    await transporter.sendMail({
        from: `Blogs by Lukas Staub <${process.env.MAIL_FROM}>`,
        to: process.env.MAIL_TO,
        subject: "Neuer Kommentar",
        text: `Ein neuer Kommentar wurde eingereicht!\n\nhttps://admin.lukasstaub.dev/blogs/comments`,
    });

    return res.render("comment-submitted", { title: req.i18n.title_comment_submitted, i18n: req.i18n, blog: post });
});

module.exports = router;
