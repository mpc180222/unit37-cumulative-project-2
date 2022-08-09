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
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
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
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(name, minEmployees, maxEmployees) {
    // ${(maxEmployees ? `WHERE num_employees <${maxEmployees}` : '')}
    //This method may receive filters for min/max employees, or a name to filter on. The query uses template literals to construct either
    //a simple select statement if no filter criteria are passed, but will include a WHERE statement and relevant columns if the method
    //receives filtering criteria.
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  ${(minEmployees || maxEmployees  ? 'num_employees AS "numEmployees",' : '' )}
                  logo_url AS "logoUrl"
           FROM companies
           ${(minEmployees && maxEmployees && name ? `WHERE num_employees >${minEmployees} AND num_employees <${maxEmployees} AND lower(name) LIKE '%${name}%'` : '')}
           ${(minEmployees && !maxEmployees && name ? `WHERE num_employees >${minEmployees} AND lower(name) LIKE %${name}%` : '')}
           ${(maxEmployees && !minEmployees && name ? `WHERE num_employees <${maxEmployees} AND lower(name) LIKE %${name}%` : '')}
           ${(minEmployees && maxEmployees && !name ? `WHERE num_employees >${minEmployees} AND num_employees <${maxEmployees}` : '')}
           ${(minEmployees && !maxEmployees && !name ? `WHERE num_employees >${minEmployees}` : '')}
           ${(maxEmployees && !minEmployees && !name ? `WHERE num_employees <${maxEmployees}` : '')}
           ORDER BY num_employees`);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT companies.handle,
                  companies.name,
                  companies.description,
                  companies.num_employees AS "numEmployees",
                  companies.logo_url AS "logoUrl",
                  jobs.id,
                  jobs.title,
                  jobs.salary,
                  jobs.equity
           FROM jobs JOIN companies ON companies.handle = jobs.company_handle
           WHERE jobs.company_handle = $1`,
        [handle]);

    const res = companyRes.rows;
    const jobsArr = res.map(r => ({id: r.id, title: r.title, salary: r.salary, equity: r.equity}))

    if (res.length === 0) throw new NotFoundError(`No company: ${handle}`);


    return {
      handle: res[0].handle,
      name: res[0].name,
      description: res[0].description,
      numEmployees: res[0].numEmployees,
      logoUrl: res[0].logoUrl,
      jobs: jobsArr

    };
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

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
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
}


module.exports = Company;
