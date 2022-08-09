"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new company data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ title, salary, equity, company_handle}) {
    if(!title || !company_handle || salary < 0 || equity < 0 || equity > 1 || arguments.length > 4 || typeof salary !== "number") throw new BadRequestError();
    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle`,
        [title, salary, equity, company_handle],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(title, minSalary, hasEquity) {
    // ${(maxEmployees ? `WHERE num_employees <${maxEmployees}` : '')}
    //This method may receive filters for min salary, job title, or equity included/not included. The query uses template literals to construct either
    //a simple select statement if no filter criteria are passed, but will include a WHERE statement and relevant columns if the method
    //receives filtering criteria.
    // if(typeof +minSalary != "number") throw new BadRequestError();
    const queryStr = `SELECT id,
    title,
    salary,
    equity,
    company_handle
FROM jobs
${title !== null || minSalary !== null || hasEquity !==null ? 'WHERE ' : ''}
${title && minSalary || title && hasEquity ? `lower(title) LIKE '%${title}%' AND equity >0`:''}
${title && !minSalary && !hasEquity ? `lower(title) LIKE '%${title}%'`:''}
${!title && !minSalary && hasEquity ? `equity > 0 ` : ''}
${!title && minSalary && !hasEquity ? `salary >= ${minSalary}` : ''}
${!title && minSalary && hasEquity ? `salary >= ${minSalary} AND equity > 0 ` : ''}

ORDER BY title`
    const jobsRes = await db.query(queryStr);
    return jobsRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    if(isNaN(+id)) throw new NotFoundError();
    const jobRes = await db.query(
          `SELECT title,
                  salary,
                  equity,
                  company_handle
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`Job not found.`);

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
    if(isNaN(+id) || Object.keys(data).length === 0 || Object.keys(data).length > 3 || data.id || data.company_handle || data.companyHandle ) throw new BadRequestError("Invalid Data");
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
        
          
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job found with that ID.`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    if(isNaN(+id)) throw new NotFoundError();
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id, title`,
        [id]);
    const job = result.rows[0];
    if (!job) throw new NotFoundError(`No job found with that ID.`);
    return job
    
  }
}


module.exports = Job;