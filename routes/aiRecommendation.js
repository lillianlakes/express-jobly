"use strict";

/** Routes for free, internal AI features. */

const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureCorrectUserOrAdmin } = require("../middleware/auth");
const User = require("../models/user");

const router = new express.Router();

/** GET /recommendations/:username?limit=10 => { recommendations, meta }
 *
 * Returns ranked job recommendations without external AI APIs.
 * Each recommendation includes `score` as an integer normalized to 0-100.
 *
 * Authorization required: login as admin or correct user
 */

router.get("/recommendations/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  const { username } = req.params;
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new BadRequestError("limit must be an integer between 1 and 50");
  }

  const result = await User.recommendJobs(username, { limit });
  return res.json(result);
});

module.exports = router;
