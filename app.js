"use strict";

/** Express app for jobly. */

const express = require("express");
const cors = require("cors");

const { NotFoundError } = require("./expressError");

const { authenticateJWT } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const companiesRoutes = require("./routes/companies");
const usersRoutes = require("./routes/users");
const jobsRoutes = require("./routes/jobs");

const morgan = require("morgan");

const app = express();

const allowedOrigins = new Set([
  "https://www.jobly.lillianlakes.com",
  "https://jobly.lillianlakes.com",
  "https://jobly-lillian.netlify.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN
    .split(",")
    .map(origin => origin.trim().replace(/\/$/, ""))
    .filter(Boolean)
    .forEach(origin => allowedOrigins.add(origin));
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  }
}));
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);

app.use("/auth", authRoutes);
app.use("/companies", companiesRoutes);
app.use("/users", usersRoutes);
app.use("/jobs", jobsRoutes);


/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  const status = err.status || 500;
  const message = err.message;
  if (process.env.NODE_ENV !== "test") console.error(err.stack);

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
