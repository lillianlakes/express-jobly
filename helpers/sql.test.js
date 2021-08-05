const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const { findAll } = require("../models/company");
const { sqlForPartialUpdate } = require("./sql");

//TODO: why console.error from app.js --> we got the console.error because it's logging that the error
// happened, but we caught it.

describe("sqlForPartialUpdate", function () {
  test("works: keys available", function () {
    const dataToUpdate = { name: "TestName", description: "TestDescription", numEmployees: 10 };
    const jsToSql = { name: "name", description: "description", numEmployees: "num_employees" };

    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(setCols).toEqual(`"name"=$1, "description"=$2, "num_employees"=$3`);
    expect(values).toEqual(["TestName", "TestDescription", 10]);
  });

  test("does not work: length of keys is zero", function () {
    const dataToUpdate = {};
    const jsToSql = { name: "name", description: "description", numEmployees: "num_employees" };

    // fail(): I expect line 30 to throw an error... but if for some reason it doesn't throw an errow,
    // test won't pass... silent false-positive. So use fail() function to prevent false-positive. If
    // line 30 doesn't throw an errow, I want you to fail and throw an error.
    try {
      sqlForPartialUpdate(dataToUpdate, jsToSql);
      fail();
    } catch (err) {
      expect(err.message).toEqual("No data");
      expect(err.status).toEqual(400);
    }
  });
  
  test("works: jsToSql is empty", function () {
    const dataToUpdate = { name: "TestName" };
    const jsToSql = {};

    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(setCols).toEqual(`"name"=$1`);
    expect(values).toEqual(["TestName"]);
  });
});