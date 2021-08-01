const knex = require("knex");

module.exports = knex({
    client: "mysql",
    connection: {
        host: process.env.DB_HOST,
        user: process.env.FRONTEND_USERNAME,
        password: process.env.FRONTEND_PASSWORD,
        database: process.env.DB_NAME,
        charset: "utf8mb4",
    },
});
