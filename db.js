"use strict";

/** Database setup for jobly. */

const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

const db = new Client({
  connectionString: getDatabaseUri(),
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

db.connect()
  .then(() => {
    console.log("Connected to database");
    return db.query("SET search_path TO public");
  })
  .then(() => {
    console.log("Search path set to public");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });

module.exports = db;
