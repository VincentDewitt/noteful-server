const { DB_URL } = require('../config')
const app = require('./app')
const { PORT } = require('../config')
const knex = require('knex')

const db = knex({
    client:'pg',
    connection: DB_URL,
})
app.set('db',db)

app.listen(PORT, () => {
    console.log(`Sever listening at http://localhost:${PORT}`)
})