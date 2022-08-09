"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("../models/job");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /companies", function () {
  const newJob = {
    title: "new job",
    salary: 12000,
    equity: 0,
    company_handle: "c1",
  };

  test("ok for admin users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    // expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {...newJob,
        equity: "0",
            id: expect.any(Number)},
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({error:{
      message: "Unauthorized",
      status: 401
    }});
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          salary: 40000,
          equity: 0,
          company_handle: "c1",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new job",
      salary: "high salary",
      equity: 0,
      company_handle: "c1",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({"error": {"message": "Invalid Data", "status": 400}});
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
      [
        {
          id: expect.any(Number),
          title: "assistant",
          salary: 40000,
          equity: "0",
          company_handle: "c1"
        },
        {
          id: expect.any(Number),
          title: "sales assistant",
          salary: 60000,
          equity: "0.01",
          company_handle: "c2"
        },
        {
          id: expect.any(Number),
          title: "teacher",
          salary: 50000,
          equity: "0",
          company_handle: "c1"
        }
      ]
    });
  });



  test("handles min/max query parameters", async function () {
    const resp = await request(app).get("/jobs/").query({
      minSalary: 45000
    });
    expect(resp.body).toEqual({
    jobs:
    [
      {
        id: expect.any(Number),
        title: "sales assistant",
        salary: 60000,
        equity: "0.01",
        company_handle: "c2"
      },
      {
        id: expect.any(Number),
        title: "teacher",
        salary: 50000,
        equity: "0",
        company_handle: "c1"
      }
    ],
    });
  });

  test("throws error if salary filter is NaN", async function () {
    const resp = await request(app).get("/jobs/").query({
      minSalary: "a high one"
    });
    expect(resp.body).toEqual({
    error:
      {
        message: "Bad Request",
        status: 400
      }
    });
  });

  test("search filter by name works", async function () {
    const resp = await request(app).get("/jobs/").query({
      title: "assistant"
    });
    expect(resp.body).toEqual({
      jobs:
      [
        {
          id: expect.any(Number),
          title: "assistant",
          salary: 40000,
          equity: "0",
          company_handle: "c1"
        },
        {
          id: expect.any(Number),
          title: "sales assistant",
          salary: 60000,
          equity: "0.01",
          company_handle: "c2"
        }
      ]
    });
  });

  test("filter by name and equity works", async function () {
    const resp = await request(app).get("/jobs/").query({
      title: "assistant",
      hasEquity: true
    });
    expect(resp.body).toEqual({
      jobs:
      [
        {
          id: expect.any(Number),
          title: "sales assistant",
          salary: 60000,
          equity: "0.01",
          company_handle: "c2"
        }
      ]
    });
  });

  // test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
//     await db.query("DROP TABLE companies CASCADE");
//     const resp = await request(app)
//         .get("/companies")
//         .set("authorization", `Bearer ${u1Token}`);
//     expect(resp.statusCode).toEqual(500);
//   });
});

/************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    let query = await db.query(`SELECT id FROM jobs where title = 'teacher'`);
    let id = query.rows[0].id;
    const resp = await request(app).get(`/jobs/${id}`);
    expect(resp.body).toEqual({
      job: {
        title: "teacher",
        salary: 50000,
        equity: "0",
        company_handle: "c1"
      },
    });
  });

  

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/jobs/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin users", async function () {

    let query = await db.query(`SELECT id FROM jobs where title = 'teacher'`);
    let id = query.rows[0].id;


    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "teacher-edit",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        "companyHandle": "c1",
         "equity": "0",
         "id": expect.any(Number),
         "salary": 50000,
         "title": "teacher-edit",
      },
    });
  });

  test("unauth for non-admin users", async function () {
    let query = await db.query(`SELECT id FROM jobs where title = 'teacher'`);
    let id = query.rows[0].id;
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "teacher-edit",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({error:{
      message: "Unauthorized",
      status: 401
    }});
  });

  test("unauth for anon", async function () {
    let query = await db.query(`SELECT id FROM jobs where title = 'teacher'`);
    let id = query.rows[0].id;
    const resp = await request(app)
        .patch(`/companies/${id}`)
        .send({
          title: "teacher-edit",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({"error": {"message": "No job found with that ID.", "status": 404}});
  });

  test("bad request on handle change attempt", async function () {
    let query = await db.query(`SELECT id FROM jobs where title = 'teacher'`);
    let id = query.rows[0].id;
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "math teacher",
          company_handle: "c3",
          
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({"error": {"message": "Invalid data in job edit request.", "status": 400}});
  });

  test("bad request on invalid data", async function () {
    let query = await db.query(`SELECT id FROM jobs where title = 'teacher'`);
    let id = query.rows[0].id;
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          salary: "very high",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({"error": {"message": "Invalid data in job edit request.", "status": 400}});
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /companies/:handle", function () {
 
  test("works for admin users", async function () {
    let query = await db.query(`SELECT id FROM jobs where title = 'teacher'`);
    let id = query.rows[0].id;
    const resp = await request(app)
        .delete(`/jobs/${id}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "teacher" });
  });

  test("unauth for non-admin users", async function () {
    let query = await db.query(`SELECT id FROM jobs where title = 'teacher'`);
    let id = query.rows[0].id;
    const resp = await request(app)
        .delete(`/jobs/${id}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    let query = await db.query(`SELECT id FROM jobs where title = 'teacher'`);
    let id = query.rows[0].id;
    const resp = await request(app)
        .delete(`/jobs/${id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({"error": {"message": "No job found with that ID.", "status": 404}});
  });
})
