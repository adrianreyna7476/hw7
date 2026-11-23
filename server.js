const express = require("express");
const { Pool, types } = require("pg");

const app = express();

types.setTypeParser(1082, (val) => val);

const db = new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "Reyna",
    database: "dashboard"
});

app.use(express.static("public"));

app.get("/api/dashboard", async (req, res) => {
    try {
        let rev = await db.query("SELECT sum(saleamount) FROM sales");
        let custTotal = await db.query("SELECT count(*) FROM customers");
        let orderTotal = await db.query("SELECT count(quantity) FROM orders");
        let issueTotal = await db.query("SELECT count(id) FROM alerts WHERE type = 'issues'");
        let notifTotal = await db.query("SELECT count(id) FROM alerts WHERE type = 'notifications'");

        let salesResult = await db.query(`SELECT products.name, sales.quantity, sales.saleamount
            FROM sales
            LEFT JOIN products ON sales.productid = products.id
            ORDER BY sales.id ASC`);

        let issueList = await db.query("SELECT * FROM alerts WHERE type = 'issues'");
        let notifList = await db.query("SELECT * FROM alerts WHERE type = 'notifications'");
        let taskList = await db.query("SELECT * FROM alerts WHERE type = 'tasks'");

        res.json({
            revenue: rev.rows[0].sum,
            customerCount: custTotal.rows[0].count,
            orderCount: orderTotal.rows[0].count,
            issueCount: issueTotal.rows[0].count,
            notifCount: notifTotal.rows[0].count,
            sales: salesResult.rows,
            issues: issueList.rows,
            notifications: notifList.rows,
            tasks: taskList.rows
        });
    } catch (e) {
        console.log(e);
        res.status(500).send("something went wrong with the database");
    }
});

app.get("/api/customers", async (req, res) => {
    let pageNum = parseInt(req.query.page);
    if (!pageNum || pageNum < 1) {
        pageNum = 1;
    }
    let perPage = 10;
    // OFFSET = rows to skip so page 1 skips 0 page 2 skips 10...
    let skip = (pageNum - 1) * perPage;

    try {
        let countResult = await db.query("SELECT count(*) FROM customers");
        // $1 and $2 get filled  from  array
        let custRows = await db.query("SELECT * FROM customers ORDER BY id LIMIT $1 OFFSET $2", [perPage, skip]);

        let total = parseInt(countResult.rows[0].count);

        res.json({
            customers: custRows.rows,
            page: pageNum,
            totalPages: Math.ceil(total / perPage)
        });
    } catch (e) {
        console.log(e);
        res.status(500).send("something went wrong with the database");
    }
});

app.listen(3000, () => {
    console.log("listening on http://localhost:3000");
});