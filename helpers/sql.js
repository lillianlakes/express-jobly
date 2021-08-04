const { BadRequestError } = require("../expressError");

/**
 * sqlForPartialUpdate: Takes in data that needs to be updated along with 
 * the data's keys and relevant SQL columns.
 * 
 * Input 'dataToUpdate': This is an object with the data to be updated.
 * 
 * Input 'jsToSql': The keys are the keys from the 'dataToUpdate' object  
 * and the values of the values are the names of the relevant columns in 
 * database table.
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

// if (dataToFilter.name) ---> `%${name}%`
/*
Only name
  
  WHERE name LIKE $1`, [`%${filterName}%`]

Only minEmployees

  WHERE num_employees >= $1`, [filterMinEmployees]

Only maxEmployees

  WHERE num_employees <= $1`, [filterMaxEmployees]

name, minEmployees

  WHERE name LIKE $1 AND num_employees >= $2`, [`%${filterName}%`, filterMinEmployees]

name, maxemployees

  WHERE name LIKE $1 AND num_employees <= $2`, [`%${filterName}%`, filterMaxEmployees]

minEmployees, maxEmployees

  WHERE num_employees >= $1 AND num_employees <= $2`, [filterMinEmployees, filterMaxEmployees] 

name, minEmployees, maxEmployees

  WHERE name LIKE $1 AND num_employees >= $2` AND num_employees <= $3, [`%${filterName}%`, filterMinEmployees, filterMaxEmployees] 

*/

module.exports = { sqlForPartialUpdate };
