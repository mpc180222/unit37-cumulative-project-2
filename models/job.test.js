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
    title: 'professor',
    salary: 120000,
    equity: 1.0,
    company_handle: 'c1',
  };
  const badJob = {
    salary: 120000,
    equity: 1.0,
    company_handle: 'c1',
  };
  test("works", async function () {
    let job = await Job.create(newJob);
    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'professor'`);
    expect(result.rows).toEqual([
      {
        title: "professor",
    salary: 120000,
    equity: "1",
    company_handle: "c1",
      },
    ]);
  });

  test("bad request with bad data", async function () {
    try {
      await Job.create(badJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll(null, null, null);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "administrator",
        salary: 55000,
        equity: "0.02",
        company_handle: "c2"
      },
      {
        id: expect.any(Number),
        title: "custodian",
        salary: 30000,
        equity: "0",
        company_handle: "c3"
      },
      {
        id: expect.any(Number),
        title: "principal",
        salary: 100000,
        equity: "0.03",
        company_handle: "c3"
      },
      {
        id: expect.any(Number),
        title: "teacher",
        salary: 50000,
        equity: "0.01",
        company_handle: "c1"
      }
    ]);
  });

  test("works: salary > 30000", async function () {
    let jobs = await Job.findAll(null, 30001, null);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "administrator",
        salary: 55000,
        equity: "0.02",
        company_handle: "c2"
      },
      {
        id: expect.any(Number),
        title: "principal",
        salary: 100000,
        equity: "0.03",
        company_handle: "c3"
      },
      {
        id: expect.any(Number),
        title: "teacher",
        salary: 50000,
        equity: "0.01",
        company_handle: "c1"
      }
     
    ]);
  });
  test("works: salary > 30000 and equity", async function () {
    let jobs = await Job.findAll(null, 30001, true);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "administrator",
        salary: 55000,
        equity: "0.02",
        company_handle: "c2"
      },
      {
        id: expect.any(Number),
        title: "principal",
        salary: 100000,
        equity: "0.03",
        company_handle: "c3"
      },
      {
        id: expect.any(Number),
        title: "teacher",
        salary: 50000,
        equity: "0.01",
        company_handle: "c1"
      }
     
    ]);
  });
  test("works: admin title, salary > 30000 and equity", async function () {
    let jobs = await Job.findAll('admin', 30001, true);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "administrator",
        salary: 55000,
        equity: "0.02",
        company_handle: "c2"
      }
     
    ]);
  });


  });
  test("works: salary > 101000 returns no rows", async function () {
    let jobs = await Job.findAll(null, 101000, null);
    expect(jobs).toEqual([
     
      
    ]);
  });


  


/************************************** get */

describe("get", function () {
  test("returns a job when queried", async function () {

    let query = await db.query(`SELECT id from jobs where title = 'teacher'`);
    let id = query.rows[0].id;


    let job = await Job.get(id);
    expect(job).toEqual({
      title: "teacher",
      salary: 50000 ,
      equity: "0.01",
      company_handle: "c1"
    });
  });

  test("not found if id is NaN", async function () {
    try {
      await Job.get('a');
      
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
  test("not found if no job with ID exists", async function () {
    try {
      await Job.get(0);
      
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
  const updateData = {
    title: "Substitute Teacher",
    salary: 49000,
    equity: 0.9,
    
  };

  test("works", async function () {
    let query = await db.query(`SELECT id from jobs where title = 'teacher'`);
    let id = query.rows[0].id;
    let job = await Job.update(id, updateData);
    
    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${id}`);
    expect(result.rows).toEqual([{
        title: "Substitute Teacher",
        salary: 49000,
        equity: "0.9",
        company_handle: "c1",
    }]);
})

  test("works: partial update", async function () {
    const updateDataSetNulls = {
        title: "Substitute Teacher",
        equity: 0.9,
        
    };
    let query = await db.query(`SELECT id from jobs where title = 'teacher'`);
    let id = query.rows[0].id;
    let job = await Job.update(id, updateDataSetNulls);

    const result = await db.query(
        `SELECT title, salary, equity, company_handle
        FROM jobs
        WHERE id = ${id}`);
    expect(result.rows).toEqual([{
        title: "Substitute Teacher",
        salary: 50000,
        equity: "0.9",
        company_handle: "c1",
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      console.log(err)
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if ID is NaN", async function () {
    try {
      await Job.update('no', updateData);
      fail();
    } catch (err) {
      console.log(err)
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
        let query = await db.query(`SELECT id from jobs where title = 'teacher'`);
        let id = query.rows[0].id;
      await Job.update(id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    let query = await db.query(`SELECT id from jobs where title = 'teacher'`);
    let id = query.rows[0].id;
    await Job.remove(id);
    const res = await db.query(
        `SELECT title FROM jobs WHERE id=${id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(0);
      fail();
      
    } catch (err) {
      console.log(err)
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if ID is NaN", async function () {
    try {
      await Job.remove('no');
      fail();
      
    } catch (err) {
      console.log(err)
      expect(err instanceof NotFoundError).toBeTruthy();
    }
    
    
    

  ;
});
})