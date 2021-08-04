const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

//TODO: why console.error from app.js

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

    let result;
    try {
      result = sqlForPartialUpdate(dataToUpdate, jsToSql);
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