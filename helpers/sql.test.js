const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const db = require("../db");
const Company = require("../models/company");
const User = require("../models/user");
const { sqlForPartialUpdate } = require("./sql");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("../models/_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("sqlForPartialUpdate", function () {
  test("works: keys available", function () {
    const dataToUpdate = { name: "TestName", description: "TestDescription", numEmployees: 10 };
    const jsToSql = { name: "name", description: "description", numEmployees: "num_employees" };

    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(setCols).toEqual(`"name"=$1, "description"=$2, "num_employees"=$3`);
    expect(values).toEqual(["TestName", "TestDescription", 10]);
  });

  test("does not work: length of keys is zero", function () {
    const dataToUpdate = { };
    const jsToSql = { name: "name", description: "description", numEmployees: "num_employees" };

    console.log(`right before error.....`);

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    // expect(result.statusCode).toEqual(400);
    expect(result).toThrow("No data");
    // expect(values).toEqual(["TestName", "TestDescription", 10]);
  });
});








// const { setCols, values } = sqlForPartialUpdate(
//   data,
//   {
//     firstName: "first_name",
//     lastName: "last_name",
//     isAdmin: "is_admin",
//   });

//   function sqlForPartialUpdate(dataToUpdate, jsToSql) {
//     const keys = Object.keys(dataToUpdate);
//     if (keys.length === 0) throw new BadRequestError("No data");
  
//     // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
//     const cols = keys.map((colName, idx) =>
//         `"${jsToSql[colName] || colName}"=$${idx + 1}`,
//     );
  
//     return {
//       setCols: cols.join(", "),
//       values: Object.values(dataToUpdate),
//     };
//   }


// describe("createToken", function () {
//   test("works: not admin", function () {
//     const token = createToken({ username: "test", is_admin: false });
//     const payload = jwt.verify(token, SECRET_KEY);
//     expect(payload).toEqual({
//       iat: expect.any(Number),
//       username: "test",
//       isAdmin: false,
//     });
//   });

//   test("works: admin", function () {
//     const token = createToken({ username: "test", isAdmin: true });
//     const payload = jwt.verify(token, SECRET_KEY);
//     expect(payload).toEqual({
//       iat: expect.any(Number),
//       username: "test",
//       isAdmin: true,
//     });
//   });

//   test("works: default no admin", function () {
//     // given the security risk if this didn't work, checking this specifically
//     const token = createToken({ username: "test" });
//     const payload = jwt.verify(token, SECRET_KEY);
//     expect(payload).toEqual({
//       iat: expect.any(Number),
//       username: "test",
//       isAdmin: false,
//     });
//   });
// });
