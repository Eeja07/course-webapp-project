// routes/grades.js - Grading system routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { aspectToColumnName, quoteIdentifier } = require('../utils/columnHelpers');

// Submit grades dengan perbaikan untuk debugging
router.post('/grade-submit', authenticateToken, async (req, res) => {
  console.log('==== GRADE SUBMISSION DEBUG ====');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User ID from token:', req.user.id);
  console.log('User ID type:', typeof req.user.id);
  
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
    for (const categoryKey in data) {
      if (Object.prototype.hasOwnProperty.call(data, categoryKey)) {
        categorizedData[categoryKey] = data[categoryKey];
      }
    }
    
    console.log('Categorized data:', JSON.stringify(categorizedData, null, 2));
    
    // Map categories to table names
    const categoryTableMap = {
      'penguasaan_materi': 'penguasaan_materi',
      'celah_keamanan': 'celah_keamanan',
      'fitur_utama': 'fitur_utama',
      'fitur_pendukung': 'fitur_pendukung'
    };
    
    // Process each category
    for (const [category, aspectData] of Object.entries(categorizedData)) {
      const tableName = categoryTableMap[category];
      if (!tableName) {
        console.log(`Skipping unknown category: ${category}`);
        continue;
      }
      
      console.log(`Processing ${category} (table: ${tableName})...`);
      console.log(`Data for ${category}:`, JSON.stringify(aspectData, null, 2));
      
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
      
      console.log(`Check result for ${tableName}:`, checkResult.rows.length > 0 ? 'Record exists' : 'No record found');
      
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

    // Calculate and save the final score
    console.log('Calculating final score...');
    
    // Collect all scores from all tables
    let allScores = [];
    
    for (const table of Object.values(categoryTableMap)) {
      // Get column names
      const columnsResult = await pool.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = $1 AND column_name NOT IN ('id', 'user_id', 'created_at', 'updated_at')`,
        [table]
      );
      
      const columns = columnsResult.rows.map(row => row.column_name);
      console.log(`Retrieved columns for ${table}:`, columns);
      
      if (columns.length > 0) {
        // Build query to get values
        const quotedColumns = columns.map(col => quoteIdentifier(col));
        const selectClause = quotedColumns.join(', ');
        const quotedTableName = quoteIdentifier(table);
        
        const query = `SELECT ${selectClause} FROM ${quotedTableName} WHERE user_id = $1`;
        console.log(`Query to get values from ${table}:`, query);
        
        const result = await pool.query(query, [userId]);
        console.log(`Result rows from ${table}:`, result.rows.length);
        
        if (result.rows.length > 0) {
          // Add values to the scores array
          const rowValues = Object.values(result.rows[0]);
          console.log(`Values from ${table}:`, rowValues);
          allScores = allScores.concat(rowValues);
        }
      }
    }
    
    console.log('All scores collected:', allScores);
    
    // Calculate final score
    let totalErrors = 0;
    allScores.forEach(value => {
      const numValue = parseInt(value, 10) || 0;
      console.log(`Adding value to total errors: ${value} (as number: ${numValue})`);
      totalErrors += numValue;
    });
    
    const finalScore = Math.max(90 - totalErrors, 0);
    console.log(`Total errors: ${totalErrors}, Final score: ${finalScore}`);
    
    // Determine predicate
    let predicate = '';
    if (finalScore >= 86) predicate = 'A';
    else if (finalScore >= 76) predicate = 'AB';
    else if (finalScore >= 66) predicate = 'B';
    else if (finalScore >= 61) predicate = 'BC';
    else if (finalScore >= 56) predicate = 'C';
    else if (finalScore >= 41) predicate = 'D';
    else predicate = 'E';
    
    console.log(`Final score: ${finalScore}, Predicate: ${predicate}`);
    
    // Save to nilai_akhir table
    try {
      // Periksa struktur tabel nilai_akhir
      const tableInfoQuery = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'nilai_akhir'
      `);
      console.log('Struktur tabel nilai_akhir:', tableInfoQuery.rows);
      
      const existingScore = await pool.query(
        'SELECT id FROM nilai_akhir WHERE user_id = $1',
        [userId]
      );
      
      console.log('Existing score check result:', existingScore.rows.length > 0 ? 'Score exists' : 'No score found');
      console.log('userId yang digunakan untuk query:', userId);
      
      if (existingScore.rows.length > 0) {
        console.log('Updating existing final score...');
        const updateScoreQuery = `
          UPDATE nilai_akhir 
          SET nilai_akhir = $1, predikat = $2, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $3
          RETURNING *
        `;
        console.log('Update score query:', updateScoreQuery);
        console.log('Update score params:', [finalScore, predicate, userId]);
        
        const updateResult = await pool.query(updateScoreQuery, [finalScore, predicate, userId]);
        console.log('Update score result:', updateResult.rows[0]);
      } else {
        console.log('Inserting new final score...');
        const insertScoreQuery = `
          INSERT INTO nilai_akhir (user_id, nilai_akhir, predikat)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        console.log('Insert score query:', insertScoreQuery);
        console.log('Insert score params:', [userId, finalScore, predicate]);
        
        const insertResult = await pool.query(insertScoreQuery, [userId, finalScore, predicate]);
        console.log('Insert score result:', insertResult.rows[0]);
      }
    } catch (scoreError) {
      console.error('Error saving score to nilai_akhir:', scoreError);
      console.error('Error detail:', scoreError.detail);
      console.error('Error code:', scoreError.code);
      throw scoreError; // Re-throw to handle in outer catch block
    }

    // Commit the transaction
    console.log('All operations successful, committing transaction...');
    await pool.query('COMMIT');
    console.log('Transaction committed successfully');

    console.log('Grade submission completed successfully!');
    res.status(200).json({
      message: 'Assessment data saved successfully',
      finalScore: finalScore,
      predicate: predicate
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
router.get('/grades/final', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    // Mendefinisikan tabel yang akan diquery
    const tables = [
      { name: 'penguasaan_materi', key: 'penguasaan_materi' },
      { name: 'celah_keamanan', key: 'celah_keamanan' },
      { name: 'fitur_utama', key: 'fitur_utama' },
      { name: 'fitur_pendukung', key: 'fitur_pendukung' }
    ];
    
    // Menginisialisasi array untuk menyimpan semua nilai
    let allScores = [];
    
    // Query setiap tabel untuk mendapatkan nilai
    for (const table of tables) {
      // Pertama dapatkan nama kolom dari database (kecuali kolom id, user_id, created_at, updated_at)
      const columnsResult = await pool.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = $1 AND column_name NOT IN ('id', 'user_id', 'created_at', 'updated_at')`,
        [table.name]
      );
      
      const columns = columnsResult.rows.map(row => row.column_name);
      
      if (columns.length > 0) {
        // Membangun query dinamis untuk mendapatkan hanya nilai dari kolom yang relevan
        const quotedColumns = columns.map(col => quoteIdentifier(col));
        const selectClause = quotedColumns.join(', ');
        const quotedTableName = quoteIdentifier(table.name);
        
        const query = `SELECT ${selectClause} FROM ${quotedTableName} WHERE user_id = $1`;
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length > 0) {
          // Mengambil semua nilai dari baris pertama dan menambahkannya ke array allScores
          const rowValues = Object.values(result.rows[0]);
          allScores = allScores.concat(rowValues);
        }
      }
    }
    
    // Menghitung nilai akhir
    let totalErrors = 0;
    allScores.forEach(value => {
      // Pastikan nilai dikonversi ke number
      totalErrors += parseInt(value, 10) || 0;
    });
    
    const finalScore = Math.max(90 - totalErrors, 0);
    
    // Menentukan predikat
    let predicate = '';
    if (finalScore >= 86) predicate = 'A';
    else if (finalScore >= 76) predicate = 'AB';
    else if (finalScore >= 66) predicate = 'B';
    else if (finalScore >= 61) predicate = 'BC';
    else if (finalScore >= 56) predicate = 'C';
    else if (finalScore >= 41) predicate = 'D';
    else predicate = 'E';
    
    // Cek apakah sudah ada nilai akhir untuk user ini
    const existingScore = await pool.query(
      'SELECT id FROM nilai_akhir WHERE user_id = $1',
      [userId]
    );
    
    let scoreRecord;
    
    if (existingScore.rows.length > 0) {
      // Update nilai yang sudah ada
      scoreRecord = await pool.query(
        `UPDATE nilai_akhir 
         SET nilai_akhir = $1, predikat = $2, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $3
         RETURNING *`,
        [finalScore, predicate, userId]
      );
    } else {
      // Insert nilai baru
      scoreRecord = await pool.query(
        `INSERT INTO nilai_akhir (user_id, nilai_akhir, predikat)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, finalScore, predicate]
      );
    }
    
    res.status(200).json({
      message: 'Final score calculated and saved successfully',
      data: {
        totalErrors,
        finalScore,
        predicate,
        record: scoreRecord.rows[0]
      }
    });
  } catch (error) {
    console.error('Error calculating and saving final score:', error);
    res.status(500).json({ 
      message: 'Failed to calculate and save final score', 
      error: error.message 
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
// Route untuk mengambil nilai akhir user
router.get('/final-grades', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Query untuk mengambil data nilai akhir berdasarkan user_id
    const result = await pool.query(
      `SELECT 
        id, 
        user_id, 
        nilai_akhir, 
        predikat, 
        created_at, 
        updated_at 
      FROM nilai_akhir 
      WHERE user_id = $1`,
      [userId]
    );
    
    // Jika data tidak ditemukan
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Final score not found for this user',
        data: {
          finalScore: null,
          predicate: null
        }
      });
    }

    // Format data untuk frontend
    const finalScoreData = {
      finalScore: result.rows[0].nilai_akhir,
      predicate: result.rows[0].predikat,
      scoreId: result.rows[0].id,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    res.status(200).json({
      message: 'Final score fetched successfully',
      data: finalScoreData
    });
  } catch (error) {
    console.error('Error fetching final score:', error);
    res.status(500).json({ 
      message: 'Failed to fetch final score', 
      error: error.message,
      data: {
        finalScore: null,
        predicate: null
      }
    });
  }
});

module.exports = router;