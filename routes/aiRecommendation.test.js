"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** GET /ai/recommendations/:username */

describe("GET /ai/recommendations/:username", function () {
  test("works for same user", async function () {
    await db.query(
      `INSERT INTO public.applications (username, job_id)
       VALUES ('u2', 1)`,
    );

    const resp = await request(app)
      .get("/ai/recommendations/u2?limit=2")
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body.meta.returned).toBeLessThanOrEqual(2);
    expect(resp.body).toEqual({
      recommendations: expect.any(Array),
      meta: {
        totalCandidates: expect.any(Number),
        returned: expect.any(Number),
      },
    });

    const recommendedJobIds = resp.body.recommendations.map(job => job.id);
    expect(recommendedJobIds).not.toContain(1);

    if (resp.body.recommendations.length > 0) {
      expect(resp.body.recommendations[0]).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
          companyHandle: expect.any(String),
          score: expect.any(Number),
          reasons: expect.any(Array),
        }),
      );
    }
  });

  test("works for admin requesting another user", async function () {
    const resp = await request(app)
      .get("/ai/recommendations/u2")
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      recommendations: expect.any(Array),
      meta: {
        totalCandidates: expect.any(Number),
        returned: expect.any(Number),
      },
    });
  });

  test("forbidden for different non-admin user", async function () {
    const resp = await request(app)
      .get("/ai/recommendations/u3")
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(403);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .get("/ai/recommendations/u2");

    expect(resp.statusCode).toEqual(401);
  });

  test("404 for missing user", async function () {
    const resp = await request(app)
      .get("/ai/recommendations/nope")
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(404);
  });

  test("400 for invalid limit", async function () {
    const resp = await request(app)
      .get("/ai/recommendations/u2?limit=abc")
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(400);
  });
});
