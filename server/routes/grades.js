// routes/grades.js - Grading system routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { aspectToColumnName, quoteIdentifier } = require('../utils/columnHelpers');

// Submit grades
router.post('/grade-submit', authenticateToken, async (req, res) => {
  console.log('==== GRADE SUBMISSION DEBUG ====');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User ID from token:', req.user.id);
  
  const { parameter, data } = req.body;
  const userId = req.user.id;

  console.log('Parameter:', parameter);
  console.log('Data keys received:', Object.keys(data));

  if (!parameter || !data) {
    console.log('Missing required fields: parameter or data is missing');
    return res.status(400).json({ message: 'Parameter and data are required' });
  }

  try {
    // Start a transaction
    console.log('Beginning transaction...');
    await pool.query('BEGIN');

    // Debug the database connection
    try {
      const testQuery = await pool.query('SELECT NOW()');
      console.log('Database connection test successful:', testQuery.rows[0]);
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      await pool.query('ROLLBACK');
      return res.status(500).json({ 
        message: 'Database connection error', 
        error: dbError.message 
      });
    }

    // Group submitted data by category
    const categorizedData = {};
    for (const [key, value] of Object.entries(data)) {
      // Parse key format: "Category-Aspect"
      const [category, ...aspectParts] = key.split('-');
      const aspect = aspectParts.join('-'); // In case aspect name has hyphens
      
      if (!categorizedData[category]) {
        categorizedData[category] = {};
      }
      
      if (value !== undefined && value !== '') {
        const columnName = aspectToColumnName(aspect);
        categorizedData[category][columnName] = parseInt(value) || 0;
      }
    }
    
    console.log('Categorized data:', categorizedData);
    
    // Map categories to table names
    const categoryTableMap = {
      'Penguasaan Materi': 'penguasaan_materi',
      'Celah Keamanan': 'celah_keamanan',
      'Fitur Utama': 'fitur_utama',
      'Fitur Pendukung': 'fitur_pendukung'
    };
    
    // Process each category
    for (const [category, aspectData] of Object.entries(categorizedData)) {
      const tableName = categoryTableMap[category];
      if (!tableName) {
        console.log(`Skipping unknown category: ${category}`);
        continue;
      }
      
      console.log(`Processing ${category} (table: ${tableName})...`);
      
      // Get existing columns from the database
      const columnsQuery = await pool.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = $1 AND column_name NOT IN ('id', 'user_id', 'created_at', 'updated_at')`,
        [tableName]
      );
      
      const existingColumns = columnsQuery.rows.map(row => row.column_name);
      console.log(`Existing columns for ${tableName}:`, existingColumns);
      
      // Check if record exists for this user
      const quotedTableName = quoteIdentifier(tableName);
      const checkQuery = `SELECT * FROM ${quotedTableName} WHERE user_id = $1`;
      const checkResult = await pool.query(checkQuery, [userId]);
      
      if (checkResult.rows.length === 0) {
        // Insert new record with dynamic columns
        console.log(`Creating new record in ${tableName}...`);
        
        // Build the SQL query dynamically
        const columns = ['user_id'];
        const values = [userId];
        const placeholders = ['$1'];
        let paramIndex = 2;
        
        // Add each column with proper quoting to handle reserved words
        for (const [colName, colValue] of Object.entries(aspectData)) {
          columns.push(quoteIdentifier(colName));
          values.push(colValue);
          placeholders.push(`$${paramIndex++}`);
        }
        
        const insertQuery = `
          INSERT INTO ${quotedTableName} (${columns.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;
        
        console.log('Insert query:', insertQuery);
        console.log('Insert values:', values);
        
        const insertResult = await pool.query(insertQuery, values);
        console.log(`Insert successful, returned rows:`, insertResult.rows.length);
      } else {
        // Update existing record with dynamic columns
        console.log(`Updating existing record in ${tableName}...`);
        
        // Build the SQL query dynamically with proper quoting
        const setClauses = [];
        const values = [userId]; // First parameter is user_id for WHERE clause
        let paramIndex = 2;
        
        for (const [colName, colValue] of Object.entries(aspectData)) {
          setClauses.push(`${quoteIdentifier(colName)} = $${paramIndex++}`);
          values.push(colValue);
        }
        
        const updateQuery = `
          UPDATE ${quotedTableName}
          SET ${setClauses.join(', ')}
          WHERE user_id = $1
          RETURNING *
        `;
        
        console.log('Update query:', updateQuery);
        console.log('Update values:', values);
        
        const updateResult = await pool.query(updateQuery, values);
        console.log(`Update successful, affected rows:`, updateResult.rows.length);
      }
    }

    // Commit the transaction
    console.log('All operations successful, committing transaction...');
    await pool.query('COMMIT');

    console.log('Grade submission completed successfully!');
    res.status(200).json({
      message: 'Assessment data saved successfully',
    });
  } catch (error) {
    // Rollback in case of error
    console.error('ERROR in grade submission:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    try {
      console.log('Rolling back transaction...');
      await pool.query('ROLLBACK');
      console.log('Rollback successful');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    
    res.status(500).json({ 
      message: 'Failed to save assessment data', 
      error: error.message,
      details: error.detail || 'No additional details available'
    });
  }
});

// Fetch grades
router.get('/grades', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Define the tables to query
    const tables = [
      { name: 'penguasaan_materi', key: 'penguasaan_materi' },
      { name: 'celah_keamanan', key: 'celah_keamanan' },
      { name: 'fitur_utama', key: 'fitur_utama' },
      { name: 'fitur_pendukung', key: 'fitur_pendukung' }
    ];
    
    // Initialize the result object
    const gradesData = {};
    
    // Query each table
    for (const table of tables) {
      // First get the column names from the database
      const columnsResult = await pool.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = $1 AND column_name NOT IN ('id', 'user_id', 'created_at', 'updated_at')`,
        [table.name]
      );
      
      const columns = columnsResult.rows.map(row => row.column_name);
      
      if (columns.length > 0) {
        // Build a dynamic query to select only existing columns
        const quotedColumns = ['id', 'user_id', ...columns].map(col => quoteIdentifier(col));
        const selectClause = quotedColumns.join(', ');
        const quotedTableName = quoteIdentifier(table.name);
        
        const query = `SELECT ${selectClause} FROM ${quotedTableName} WHERE user_id = $1`;
        const result = await pool.query(query, [userId]);
        
        gradesData[table.key] = result.rows[0] || {};
      } else {
        gradesData[table.key] = {};
      }
    }

    res.status(200).json({
      message: 'Assessment data fetched successfully',
      data: gradesData
    });
  } catch (error) {
    console.error('Error fetching assessment data:', error);
    res.status(500).json({ 
      message: 'Failed to fetch assessment data', 
      error: error.message 
    });
  }
});

module.exports = router;