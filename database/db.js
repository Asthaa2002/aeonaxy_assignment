const pgp = require('pg-promise')();
const { DB_URI } = require("../config");

const db = pgp(DB_URI);

module.exports = db;
