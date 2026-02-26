const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. Database Connection Configuration
const pool = new Pool({
  host: process.env.DB_HOST, // Use 127.0.0.1 if localhost fails
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 5432,
  // Add SSL if you are connecting to AWS RDS later÷
  ssl: {
    rejectUnauthorized: false 
  }
});

// --- CONNECTION TEST (This runs when you start the server) ---
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ DATABASE CONNECTION FAILED:', err.stack);
  }
  console.log('🐘 SUCCESS: Connected to PostgreSQL (tododb)');
  release();
});

// 2. Routes (API Endpoints)

// Get all todos
app.get('/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Add a todo
app.post('/todos', async (req, res) => {
  try {
    const { task } = req.body;
    const result = await pool.query(
      'INSERT INTO todos (task) VALUES ($1) RETURNING *', 
      [task]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ POST ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete a todo
app.delete('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM todos WHERE id = $1', [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Start Server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
