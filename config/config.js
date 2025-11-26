require("ts-node").register();
const _envs = require("./../src/config/envs.ts");

module.exports = {
	development: {
		dialect: "postgres",
		host: "localhost",
		port: 5433,
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE,
	},
	test: {
		dialect: "postgres",
		host: "localhost",
		port: 5433,
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_TEST_DATABASE,
	},
	production: {
		dialect: "postgres",
		host: "localhost",
		port: 5432,
		username: "postgres",
		password: "password",
		database: "prod",
	},
};
