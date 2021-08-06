"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
        `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
        `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   * 
   * if data is not empty, filters the search otherwise finds all companies
   * data = from query string
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(data = {}) {
    const { whereCols, values } = this._sqlForFilter(data);
    
    const companiesRes = await db.query(
      `SELECT handle,
      name,
      description,
      num_employees AS "numEmployees",
      logo_url AS "logoUrl"
      FROM companies
      ${whereCols}
      ORDER BY name`,
      [...values]);
    const companies = companiesRes.rows;

    if (companies.length < 1) throw new NotFoundError(`Company not found`);

    return companiesRes.rows;
  }    
    //OLD VERSION OF findALL()
      // static async findAll() {
      //   const companiesRes = await db.query(
      //       `SELECT handle,
      //               name,
      //               description,
      //               num_employees AS "numEmployees",
      //               logo_url AS "logoUrl"
      //          FROM companies
      //          ORDER BY name`);
      //   return companiesRes.rows;
      // }

  /** Filter all companies.
   * 
   * Given object with optional filtering criteria:
   *  { name, minEmployees, maxEmployees }
   * 
   * Returns [{ handle, name, description, numEmployees, logoUrl}, ...]
   * 
   * Throws NotFoundError if not found.
   */


  // static async filter(data) {
  //   const { whereCols, values } = this._sqlForFilter(data);
    
  //   const companiesRes = await db.query(
  //     `SELECT handle,
  //             name,
  //             description,
  //             num_employees AS "numEmployees",
  //             logo_url AS "logoUrl"
  //       FROM companies
  //       WHERE ${whereCols}
  //       ORDER BY name`,
  //       [...values]);

  //   const companies = companiesRes.rows;

  //   if (companies.length < 1) throw new NotFoundError(`Company not found`);

  //   return companies;
  // }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
        `SELECT c.handle,
                c.name,
                c.description,
                c.num_employees AS "numEmployees",
                c.logo_url AS "logoUrl",
                j.id,
                j.title,
                j.salary,
                j.equity
           FROM companies AS c
              LEFT JOIN jobs AS j ON c.handle = j.company_handle
           WHERE c.handle = $1`,
        [handle]);
    const company = companyRes.rows.map(c => ({
      handle: c.handle, 
      name: c.name, 
      description: c.description, 
      numEmployees: c.numEmployees, 
      logoUrl: c.logoUrl
    }))[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    if(companyRes.rows[0].id) {
      const jobs = companyRes.rows.map(c => ({
        id: c.id, 
        title: c.title, 
        salary: c.salary, 
        equity: c.equity
      }));
      company.jobs = jobs;
    }

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
        `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }

  /** Helper function to filter companies
   * 
   * Given an object like { name, maxEmployees, minEmployees}
   * 
   * If object has other keys besides name, maxEmployees, minEmployees, throws an error
   * 
   * Returns object: {
   *  whereCols: is a string separated by AND
   *  values: is an array representing the values of the given object
   * }
   */

  static _sqlForFilter(dataToFilter) {
    const jsToSqlWhere = { name: `name ILIKE` , minEmployees: `num_employees >=`, maxEmployees: `num_employees <=` }
    const keys = Object.keys(dataToFilter);

    for (let key of keys) {
      if (!jsToSqlWhere[key]) {
        throw new BadRequestError("Incorrect filtering field");
      }
    }
    
    // {name: 'net' , minEmployees:  10 } => ['name ILIKE $1', 'num_employees >= $2']
    const cols = keys.map((colName, idx) => `${jsToSqlWhere[colName]} $${idx + 1}`);
  
    if (dataToFilter.minEmployees > dataToFilter.maxEmployees) {
      let message = 'Min employees cannot be greater than the max employees.'
      throw new BadRequestError(message);
    } 

    if (dataToFilter.name) {
      dataToFilter.name = `%${dataToFilter.name}%`;
    }
  
    let where = cols.length > 0 ? `WHERE ${cols.join(" AND ")}` : ``;

    return {
      whereCols: where,
      values: Object.values(dataToFilter),
    };

    // return {
    //   whereCols: cols.join(" AND "),
    //   values: Object.values(dataToFilter),
    // };
  }
}

module.exports = Company;
