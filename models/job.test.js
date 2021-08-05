"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 600,
    equity: 0,
    company_handle: "c2"
  };
  const newJob2 = {
    title: "new2",
    salary: "Not a number",
    equity: 0,
    company_handle: "c2"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "new",
      salary: 600,
      equity: "0",
      company_handle: "c2"
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new'`);
    expect(result.rows).toEqual([
      {
        title: "new",
        salary: 600,
        equity: "0",
        company_handle: "c2"
      },
    ]);
  });

  test("bad request with invalid inputs", async function () {
    try {
      let job = await Job.create(newJob2);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
      expect(err.message).toEqual(`The job could not be created.`);
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 50,
        equity: "0",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 100,
        equity: "0.002",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 20,
        equity: null,
        company_handle: "c2",
      },
    ]);
  });
});

/************************************** findAll with filtering */

describe("filter", function () {
  test("works: correct name filter", async function () {
    let jobs = await Job.findAll({title: "j"});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 50,
        equity: "0",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 100,
        equity: "0.002",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 20,
        equity: null,
        company_handle: "c2",
      },
    ]);
  });

  test("works: case-insensitive filter", async function () {
    let jobs = await Job.findAll({title: "J"});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 50,
        equity: "0",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 100,
        equity: "0.002",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 20,
        equity: null,
        company_handle: "c2",
      },
    ]);
  });

  test("works: correct salary filter", async function () {
    let jobs = await Job.findAll({minSalary: 30});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 50,
        equity: "0",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 100,
        equity: "0.002",
        company_handle: "c1",
      }
    ]);
  });
  
  test("works: equity is true", async function () {
    let jobs = await Job.findAll({ hasEquity: true });
  
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 100,
        equity: "0.002",
        company_handle: "c1",
      }
    ]);
  });
  
  test("works: equity is false", async function () {
    let jobs = await Job.findAll({ hasEquity: false });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 50,
        equity: "0",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 100,
        equity: "0.002",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 20,
        equity: null,
        company_handle: "c2",
      },
    ]);
  });

  test("does not work: incorrect filter fields", async function () {
    try {
      await Job.findAll({ filter: "hello" });
      fail();
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.message).toEqual("Incorrect filtering field");
    }
  });

  test("does not work: job not found", async function () {
    try {
      await Job.findAll({title: "j4"});
      fail();
    } catch (err) {
      expect(err.status).toEqual(404);
      expect(err.message).toEqual("Job not found");
    }
  });
});

/************************************** _sqlForFilter helper function */

describe("sqlForFilter", function () {
  test("error: incorrect filtering fields", function () {
    let data = { filter: "hello world" };
    
    try {
      Job._sqlForFilter(data);
      fail();
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.message).toEqual("Incorrect filtering field");
    }
  });
  
  test("error: equity not true/false", function () {
    let data = { hasEquity: 100 };
    try {
      Job._sqlForFilter(data);
      fail();
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.message).toEqual("hasEquity must be true or false");
    }
  });
  
  test("correct output, 1 key", function () {
    let data = { title: "testTitle" };
    let resp = Job._sqlForFilter(data);

    expect(resp.whereCols).toEqual("WHERE title ILIKE $1");
    expect(resp.values).toEqual(["%testTitle%"]);
  });
  
  test("correct output, more than 1 key", function () {
    let data = { title: "testTitle", minSalary: 100 };
    let resp = Job._sqlForFilter(data);

    expect(resp.whereCols).toEqual("WHERE title ILIKE $1 AND salary >= $2");
    expect(resp.values).toEqual(["%testTitle%", 100]);
  });
});


/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
        id: expect.any(Number),
        title: "j1",
        salary: 50,
        equity: "0",
        company_handle: "c1",
      });
  });

  test("not found if no such company", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 50,
    equity: 0.01,
  };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "New",
      salary: 50,
      equity: "0.01",
      company_handle: "c1",
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = 1`);
    expect(result.rows).toEqual([{
        id: expect.any(Number),
        title: "New",
        salary: 50,
        equity: "0.01",
        company_handle: "c1",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
    };

    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "New",
      salary: null,
      equity: null,
      company_handle: "c1",
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = 1`);
    expect(result.rows).toEqual([{
      id: expect.any(Number),
      title: "New",
      salary: null,
      equity: null,
      company_handle: "c1",
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
