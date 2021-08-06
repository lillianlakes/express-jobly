"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */



describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 50000,
    equity: 0.1,
    company_handle: "c1"
  };

  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
      id: expect.any(Number),
      title: "new",
      salary: 50000,
      equity: "0.1",
      company_handle: "c1"
    }});
  });
  
  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new2",
          salary: 60000,
          equity: 0.25
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          salary: "not-an-integer"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: expect.any(Number),
              title: "t1",
              salary: 50000,
              equity: "0.1",
              company_handle: "c1"
            },
            {
              id: expect.any(Number),
              title: "t2",
              salary: 60000,
              equity: "0.25",
              company_handle: "c3"
            },
            {
              id: expect.any(Number),
              title: "t3",
              salary: 70000,
              equity: "0",
              company_handle: "c3"
            }
          ],
    });
  });

  test("filter title ok for anon", async function () {
    const resp = await request(app).get("/jobs?title=t1");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: expect.any(Number),
              title: "t1",
              salary: 50000,
              equity: "0.1",
              company_handle: "c1"
            }
          ],
    });
  });
  
  test("filter salary ok for anon", async function () {
    const resp = await request(app).get("/jobs?minSalary=60000");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: expect.any(Number),
              title: "t2",
              salary: 60000,
              equity: "0.25",
              company_handle: "c3"
            },
            {
              id: expect.any(Number),
              title: "t3",
              salary: 70000,
              equity: "0",
              company_handle: "c3"
            }
          ],
    });
  });

  test("filter equity true and ok for anon", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: expect.any(Number),
              title: "t1",
              salary: 50000,
              equity: "0.1",
              company_handle: "c1"
            },
            {
              id: expect.any(Number),
              title: "t2",
              salary: 60000,
              equity: "0.25",
              company_handle: "c3"
            }
          ],
    });
  });

  test("filter equity false and ok for anon", async function () {
    const resp = await request(app).get("/jobs?hasEquity=false");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: expect.any(Number),
              title: "t1",
              salary: 50000,
              equity: "0.1",
              company_handle: "c1"
            },
            {
              id: expect.any(Number),
              title: "t2",
              salary: 60000,
              equity: "0.25",
              company_handle: "c3"
            },
            {
              id: expect.any(Number),
              title: "t3",
              salary: 70000,
              equity: "0",
              company_handle: "c3"
            }
          ],
    });
  });

  test("filter not ok for invalid query", async function () {
    const resp = await request(app).get("/jobs?bonus=1000000");
    expect(resp.statusCode).toEqual(400);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/1`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "t1",
        salary: 50000,
        equity: "0.1",
        company_handle: "c1"
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          title: "t1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "t1-new",
        salary: 50000,
        equity: "0.1",
        company_handle: "c1"
      },
    });
  });
  
  test("forbidden for non admin user", async function () {
    const resp = await request(app)
        .patch(`/jobs/2`)
        .send({
          title: "t2-new",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/3`)
      .send({
        title: "t3-new",
      });
    expect(resp.statusCode).toEqual(401);
  })

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          id: 0,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          equity: "not-a-number",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "1" });
  });
  
  test("forbidden for non admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/2`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/3`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
