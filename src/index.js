const { Router } = require("express");
const Turndown = require("turndown");
const { markdown } = require("markdown");
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
        const strLength = 350;
        return markdown.toHTML(service.turndown(body).substring(0, strLength) + "...");
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
        featured: {
            ...featured,
            body: shorten(featured.body),
        },
    });
});

router.get("/:year/:month/:day/:slug", async (req, res) => {
    const [blog] = await knex("blogs").where("slug", "=", req.params.slug);

    if (!blog) return res.status(404).render("404", { title: req.i18n.title_not_found, i18n: req.i18n });

    return res.render("post", { cookies: req.cookies, i18n: req.i18n, title: blog.title, blog });
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

module.exports = router;
