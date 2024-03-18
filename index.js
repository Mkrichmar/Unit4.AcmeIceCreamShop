const pg = require('pg');
const express = require('express');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_icecream_db');
const app = express();

app.use(require('morgan')('dev'));
app.use(express.json());

app.get('/api/flavors', async(req, res, next) => {
    try {
        const SQL = `
        SELECT * from flavors;
        `;
        const response = await client.query(SQL);
        res.send(response.rows)
    }
    catch(error) {
        next(error)
    }
});

app.get('/api/flavors/:id', async(req, res, next) => {
    const { id } = req.params;
    try {
        const SQL = `
        SELECT * FROM flavors
        WHERE id=$1;
        `;
        const response = await client.query(SQL, [id]);
        res.send(response.rows[0])
    }
    catch(error) {
        next(error)
    }
});

app.post('/api/flavors', async(req, res, next) => {
    try {
        const SQL = `
        INSERT INTO flavors(name)
        VALUES($1)
        RETURNING *
        `;
        const response = await client.query(SQL, [req.body.name]);
        res.send(response.rows[0])
    }
    catch(error) {
        next(error)
    }
});

app.put('/api/flavors/:id', async(req, res, next) => {
    try{
        const SQL = `
        UPDATE flavors
        SET name=$1, created_at= now(), updated_at= now(), is_favorite=$2
        WHERE id=$3

        `;
        const response = await client.query(SQL, [
            req.body.name,
            req.body.is_favorite,
            req.params.id,
        ]);

    } catch(error) {
        next(error)
    }
});

app.delete('/api/flavors/:id', async(req, res, next) => {
    try {
        const SQL = `
        DELETE from notes
        WHERE id = $1
        `;

        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204);

    } catch(error) {
        next(error)
    }
})

const init = async () => {
    await client.connect()
    console.log('connected to database');

    let SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        is_favorite BOOLEAN DEFAULT FALSE
    )
    `;
    await client.query(SQL);
    console.log('tables created');

    SQL = `

    INSERT INTO flavors(name, is_favorite) VALUES('vanilla', true);
    INSERT INTO flavors(name, is_favorite) VALUES('chocolate', false);
    INSERT INTO flavors(name, is_favorite) VALUES('strawberry', false);
    `;

    await client.query(SQL);
    console.log('data seeded');

    const port = process.env.PORT || 3000
    app.listen(port, () => console.log(`listening on port ${port}`))
};

init()