"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * */
  static async create( { title, salary, equity, company_handle }) {
    const result = await db.query(
      `INSERT INTO jobs(title, salary, equity, company_handle)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, salary, equity, company_handle`,
        [title, salary, equity, company_handle],
    );
  
    const job = result.rows[0];

    if (!job) throw new BadRequestError(`The job could not be created.`);

    return job;
  }

  /** Find all jobs.
   * 
   * if data is not empty, filters the search otherwise finds all jobs
   * data = from query string
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll(data = {}) {
    const { whereCols, values } = this._sqlForFilter(data);
    
    const jobsRes = await db.query(
      `SELECT id, 
      title,
      salary,
      equity,
      company_handle
      FROM jobs
      ${whereCols}
      ORDER BY title`,
      [...values]);
    const jobs = jobsRes.rows;

    if (jobs.length < 1) throw new NotFoundError(`Job not found`);

    return jobsRes.rows;
  }  

  /** Given a job id, return data about the job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

   static async get(id) {
    const jobRes = await db.query(
        `SELECT id, 
        title,
        salary,
        equity,
        company_handle
        FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data);
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING id, title, salary, equity, company_handle`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
        `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }

  /** Helper function to filter jobs
   * 
   * Given an object like { title, minSalary, hasEquity }
   * 
   * If object has other keys besides title, minSalary, hasEquity, throws an error
   * 
   * Returns object: {
   *  whereCols: is a string separated by AND
   *  values: is an array representing the values of the given object
   * }
   */

  static _sqlForFilter(dataToFilter) {

    const jsToSqlWhere = { title: `title ILIKE` , minSalary: `salary >=`};

    if (dataToFilter.hasEquity !== undefined) {
      if (dataToFilter.hasEquity) jsToSqlWhere.hasEquity = `equity > 0`;
      delete dataToFilter.hasEquity;
    }
  
    const keys = Object.keys(dataToFilter); // 2 elements

    for (let key of keys) {
      if (!jsToSqlWhere[key]) {
        throw new BadRequestError("Incorrect filtering field");
      }
    }
    
    /**  {title: 'scientist' , minSalary:  50000, hasEquity: true } => 
    ['title ILIKE $1', 'salary >= $2', 'equity > 0] */
    const cols = keys.map((colName, idx) => `${jsToSqlWhere[colName]} $${idx + 1}`); // 2 elements

    if (dataToFilter.title) {
      dataToFilter.title = `%${dataToFilter.title}%`;
    }

    if (jsToSqlWhere.hasEquity) cols.push(jsToSqlWhere.hasEquity); // push 3rd
  
    let where = cols.length > 0 ? `WHERE ${cols.join(" AND ")}` : ``; // joining 3 filter criteria

    return {
      whereCols: where, // 3 elements
      values: Object.values(dataToFilter), // 2 elements
    };
  }
}

module.exports = Job;