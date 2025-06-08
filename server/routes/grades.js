
// routes/grades.js - Grading system routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.post('/grade-submit', authenticateToken, async (req, res) => {
  console.log('==== GRADE SUBMISSION DEBUG ====');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  const userId = req.user.id;
  const { parameter, data } = req.body;

  if (!parameter || !data) {
    return res.status(400).json({ message: 'Parameter and data are required' });
  }

  try {
    await pool.query('BEGIN');

    for (const [categoryKey, aspectData] of Object.entries(data)) {
      const parameterName = categoryKey; // pakai snake_case langsung

      for (const [aspectKey, nilai] of Object.entries(aspectData)) {
        const subAspekNama = aspectKey; // snake_case langsung
        const subAspekNilai = parseInt(nilai, 10) || 0;

        // Cek apakah data sudah ada
        const existing = await pool.query(
          `SELECT id FROM penilaian WHERE user_id = $1 AND parameter_penilaian_nama = $2 AND sub_aspek_nama = $3`,
          [userId, parameterName, subAspekNama]
        );

        if (existing.rows.length > 0) {
          await pool.query(
            `UPDATE penilaian 
             SET sub_aspek_nilai = $1, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2 AND parameter_penilaian_nama = $3 AND sub_aspek_nama = $4`,
            [subAspekNilai, userId, parameterName, subAspekNama]
          );
        } else {
          await pool.query(
            `INSERT INTO penilaian 
             (user_id, parameter_penilaian_nama, sub_aspek_nama, sub_aspek_nilai)
             VALUES ($1, $2, $3, $4)`,
            [userId, parameterName, subAspekNama, subAspekNilai]
          );
        }
      }
    }
    // kalkulasi nilai di query 
    const result = await pool.query(
      `WITH final AS (
        SELECT 
          GREATEST(90 - SUM(sub_aspek_nilai), 0) AS final_score
        FROM penilaian
        WHERE user_id = $1
      )
      SELECT 
        final_score,
        CASE
          WHEN final_score >= 86 THEN 'A'
          WHEN final_score >= 76 THEN 'AB'
          WHEN final_score >= 66 THEN 'B'
          WHEN final_score >= 61 THEN 'BC'
          WHEN final_score >= 56 THEN 'C'
          WHEN final_score >= 41 THEN 'D'
          ELSE 'E'
        END AS predicate
      FROM final;`,
      [userId]
    );
    const finalScore = parseInt(result.rows[0].final_score) || 0;
    const predicate = result.rows[0].predicate;

    const checkFinal = await pool.query(
      `SELECT id FROM nilai_akhir WHERE user_id = $1`,
      [userId]
    );

    if (checkFinal.rows.length > 0) {
      await pool.query(
        `UPDATE nilai_akhir SET nilai_akhir = $1, predikat = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3`,
        [finalScore, predicate, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO nilai_akhir (user_id, nilai_akhir, predikat) VALUES ($1, $2, $3)`,
        [userId, finalScore, predicate]
      );
    }

    await pool.query('COMMIT');

    res.status(200).json({
      message: 'Assessment data saved successfully',
      finalScore,
      predicate
    });

  } catch (err) {
    console.error('ERROR in grade submission:', err);
    await pool.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to save assessment data', error: err.message });
  }
});

// Updated add-parameter endpoint
router.post('/schema/add-parameter', authenticateToken, async (req, res) => {
  const { parameterName } = req.body;
  const userId = req.user.id;

  if (!parameterName) {
    return res.status(400).json({ message: 'Parameter name is required' });
  }

  try {
    // Check if record already exists
    const existingRecord = await pool.query(
      `SELECT id FROM penilaian 
       WHERE user_id = $1 AND parameter_penilaian_nama = $2 AND sub_aspek_nama = $3`,
      [userId, parameterName, 'Sub-aspek 1']
    );

    if (existingRecord.rows.length === 0) {
      // Only insert if it doesn't exist
      await pool.query(
        `INSERT INTO penilaian (user_id, parameter_penilaian_nama, sub_aspek_nama, sub_aspek_nilai)
         VALUES ($1, $2, $3, $4)`,
        [userId, parameterName, 'Sub-aspek 1', 0]
      );
    }

    res.status(200).json({
      message: 'Parameter added successfully',
      parameterName
    });
  } catch (error) {
    console.error('Error adding parameter:', error);
    res.status(500).json({ 
      message: 'Failed to add parameter', 
      error: error.message 
    });
  }
});

// Updated add-column endpoint
router.post('/schema/add-column', authenticateToken, async (req, res) => {
  const { categoryTitle, aspectName } = req.body;
  const userId = req.user.id;

  if (!categoryTitle || !aspectName) {
    return res.status(400).json({ message: 'Category title and aspect name are required' });
  }

  try {
    // Check if record already exists
    const existingRecord = await pool.query(
      `SELECT id FROM penilaian 
       WHERE user_id = $1 AND parameter_penilaian_nama = $2 AND sub_aspek_nama = $3`,
      [userId, categoryTitle, aspectName]
    );

    if (existingRecord.rows.length === 0) {
      // Only insert if it doesn't exist
      await pool.query(
        `INSERT INTO penilaian (user_id, parameter_penilaian_nama, sub_aspek_nama, sub_aspek_nilai)
         VALUES ($1, $2, $3, $4)`,
        [userId, categoryTitle, aspectName, 0]
      );
    }

    res.status(200).json({
      message: 'Sub-aspect added successfully',
      categoryTitle,
      aspectName
    });
  } catch (error) {
    console.error('Error adding sub-aspect:', error);
    res.status(500).json({ 
      message: 'Failed to add sub-aspect', 
      error: error.message 
    });
  }
});

// Updated add-row endpoint
router.post('/add-row', authenticateToken, async (req, res) => {
  const { rowData } = req.body;
  const userId = req.user.id;

  if (!rowData || typeof rowData !== 'object') {
    return res.status(400).json({ message: 'Row data is required' });
  }

  try {
    await pool.query('BEGIN');

    // Process each key-value pair in rowData
    for (const [key, value] of Object.entries(rowData)) {
      // Parse the key format: "Category Title-Sub Aspect Name"
      const dashIndex = key.lastIndexOf('-');
      if (dashIndex === -1) {
        continue; // Skip invalid keys
      }

      const parameterName = key.substring(0, dashIndex);
      const subAspectName = key.substring(dashIndex + 1);
      const subAspectValue = parseInt(value, 10) || 0;

      // Check if record already exists
      const existingRecord = await pool.query(
        `SELECT id FROM penilaian 
         WHERE user_id = $1 AND parameter_penilaian_nama = $2 AND sub_aspek_nama = $3`,
        [userId, parameterName, subAspectName]
      );

      if (existingRecord.rows.length > 0) {
        // Update existing record
        await pool.query(
          `UPDATE penilaian 
           SET sub_aspek_nilai = $1, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $2 AND parameter_penilaian_nama = $3 AND sub_aspek_nama = $4`,
          [subAspectValue, userId, parameterName, subAspectName]
        );
      } else {
        // Insert new record
        await pool.query(
          `INSERT INTO penilaian (user_id, parameter_penilaian_nama, sub_aspek_nama, sub_aspek_nilai)
           VALUES ($1, $2, $3, $4)`,
          [userId, parameterName, subAspectName, subAspectValue]
        );
      }
    }

    await pool.query('COMMIT');

    res.status(200).json({
      message: 'Row data added successfully',
      rowData
    });
  } catch (error) {
    console.error('Error adding row data:', error);
    await pool.query('ROLLBACK');
    res.status(500).json({ 
      message: 'Failed to add row data', 
      error: error.message 
    });
  }
});

// Fetch grades from unified table - FIXED
router.get('/grades', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Initialize gradesData object - THIS WAS MISSING
    let gradesData = {};

    // First, get all parameter names for this user
    const parametersResult = await pool.query(
      `SELECT DISTINCT parameter_penilaian_nama 
       FROM penilaian 
       WHERE user_id = $1 
       ORDER BY parameter_penilaian_nama`,
      [userId]
    );

    // Process each parameter found in database
    for (const paramRow of parametersResult.rows) {
      const parameterName = paramRow.parameter_penilaian_nama;
      gradesData[parameterName] = {};

      
      // Get all sub-aspects for this parameter
      const aspectsResult = await pool.query(
        `SELECT 
          sub_aspek_nama,
          sub_aspek_nilai
         FROM penilaian 
         WHERE user_id = $1 AND parameter_penilaian_nama = $2
         ORDER BY sub_aspek_nama`,
        [userId, parameterName]
      );

      // Map each sub-aspect to its value
      aspectsResult.rows.forEach(row => {
      gradesData[parameterName][row.sub_aspek_nama] = row.sub_aspek_nilai;

      });
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

// Get user's final score
router.get('/final-grades', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
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
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Final score not found for this user',
        data: {
          finalScore: null,
          predicate: null
        }
      });
    }

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

// Additional endpoint to get parameter structure for frontend
router.get('/grades/structure', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Get all parameters and their sub-aspects for this user
    const result = await pool.query(
      `SELECT 
        parameter_penilaian_nama,
        sub_aspek_nama,
        sub_aspek_nilai
       FROM penilaian 
       WHERE user_id = $1 
       ORDER BY parameter_penilaian_nama, sub_aspek_nama`,
      [userId]
    );

    // Group data by parameter to create structure
    const structure = {};
    
    result.rows.forEach(row => {
      const paramName = row.parameter_penilaian_nama;
      const aspectName = row.sub_aspek_nama;
      
      if (!structure[paramName]) {
        structure[paramName] = {
          title: paramName,
          aspects: []
        };
      }
      
      if (!structure[paramName].aspects.includes(aspectName)) {
        structure[paramName].aspects.push(aspectName);
      }
    });

    // Convert to array format for frontend
    const columns = Object.values(structure);

    // If no data found, return default structure
    if (columns.length === 0) {
      const defaultColumns = [
        { title: 'Penguasaan Materi', aspects: ['Sub-aspek 1'] },
        { title: 'Celah Keamanan', aspects: ['Sub-aspek 1'] },
        { title: 'Fitur Utama', aspects: ['Sub-aspek 1'] },
        { title: 'Fitur Pendukung', aspects: ['Sub-aspek 1'] }
      ];

      return res.status(200).json({
        message: 'No assessment structure found, returning default',
        columns: defaultColumns
      });
    }

    res.status(200).json({
      message: 'Assessment structure fetched successfully',
      columns: columns
    });
  } catch (error) {
    console.error('Error fetching assessment structure:', error);
    res.status(500).json({ 
      message: 'Failed to fetch assessment structure', 
      error: error.message 
    });
  }
});


// Rename sub-aspect
router.put('/schema/rename-column', authenticateToken, async (req, res) => {
  const { categoryTitle, oldAspectName, newAspectName } = req.body;
  const userId = req.user.id;

  if (!categoryTitle || !oldAspectName || !newAspectName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE penilaian 
       SET sub_aspek_nama = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND parameter_penilaian_nama = $3 AND sub_aspek_nama = $4`,
      [newAspectName, userId, categoryTitle, oldAspectName]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Sub-aspect not found' });
    }

    res.status(200).json({
      message: 'Sub-aspect renamed successfully',
      categoryTitle,
      oldAspectName,
      newAspectName
    });
  } catch (error) {
    console.error('Error renaming sub-aspect:', error);
    res.status(500).json({ 
      message: 'Failed to rename sub-aspect', 
      error: error.message 
    });
  }
});

// Delete sub-aspect
router.delete('/schema/delete-column', authenticateToken, async (req, res) => {
  const { categoryTitle, aspectName } = req.body;
  const userId = req.user.id;

  if (!categoryTitle || !aspectName) {
    return res.status(400).json({ message: 'Category title and aspect name are required' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM penilaian 
       WHERE user_id = $1 AND parameter_penilaian_nama = $2 AND sub_aspek_nama = $3`,
      [userId, categoryTitle, aspectName]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Sub-aspect not found' });
    }

    res.status(200).json({
      message: 'Sub-aspect deleted successfully',
      categoryTitle,
      aspectName
    });
  } catch (error) {
    console.error('Error deleting sub-aspect:', error);
    res.status(500).json({ 
      message: 'Failed to delete sub-aspect', 
      error: error.message 
    });
  }
});



// DELETE /api/schema/delete-aspect
router.delete('/schema/delete-aspect', authenticateToken, async (req, res) => {
const { categoryTitle } = req.body;
const userId = req.user.id;

if (!categoryTitle) {
  return res.status(400).json({ message: 'Category title is required' });
}

try {
  const result = await pool.query(
    `DELETE FROM penilaian 
      WHERE user_id = $1 AND parameter_penilaian_nama = $2`,
    [userId, categoryTitle]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Main aspect not found or already deleted' });
  }

  res.status(200).json({
    message: `Main aspect "${categoryTitle}" deleted successfully`,
    categoryTitle,
  });
} catch (error) {
  console.error('Error deleting main aspect:', error);
  res.status(500).json({
    message: 'Failed to delete main aspect',
    error: error.message,
  });
  }
});




module.exports = router;