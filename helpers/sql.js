"user strict";
const { BadRequestError } = require("../expressError");

/**
 * sqlForPartialUpdate: Takes in data that needs to be updated along with 
 * the data's keys and relevant SQL columns.
 * 
 * Input 'dataToUpdate': This is an object with the data to be updated.
 * dataToUpdate: {name: Aliya, age: 32}
 * 
 * Input 'jsToSql': The keys are the keys from the 'dataToUpdate' object  
 * and the values of the values are the names of the relevant columns in 
 * database table.
 * 
 * jsTOSql: {
 *  firstName: first_name,
 *  numEmployees: num_employees ....
 * }
 * 
 * This returns an object: { setCols, values }, where 'setCols' is a comma-
 * separated string of the parametized queries and 'values' are the values
 * from 'dataToUpdate'.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
