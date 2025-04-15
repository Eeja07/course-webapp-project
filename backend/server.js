const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { Pool } = require('pg')

const app = express()
const port = 3000

const pool = new Pool({
  user: 'eeja',
  host: 'localhost',
  database: 'basdat',
  password: '1',
  port: 5432,
})

app.use(cors())
app.use(bodyParser.json())

app.post('/api/users', async (req, res) => {
  const { nama, email } = req.body
  if (!nama || !email) {
    return res.status(400).json({ error: 'Nama dan email wajib diisi' })
  }

  try {
    const result = await pool.query(
      'INSERT INTO login (nama, email) VALUES ($1, $2) RETURNING *',
      [nama, email]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gagal menyimpan data' })
  }
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
