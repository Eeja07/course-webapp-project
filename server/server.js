const express = require('express');
const cors = require('cors');
require('dotenv').config(); // To load environment variables from .env file
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize the Express app
const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Replace with your client URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Uploads directory created: ${uploadsDir}`);
}

// Membuat folder 'uploads' dapat diakses secara publik
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add debugging to check middleware setup
console.log(`Serving static files from: ${uploadsDir}`);
console.log(`Files will be accessible at: http://localhost:4000/uploads/filename.jpg`);
// Configure PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
module.exports = pool; // Export the pool for use in other modules
// Add this function after your other imports and setup

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected:', res.rows);
  }
});
// Function to clean up unused files in uploads directory
const cleanupUnusedUploads = async () => {
  try {
    // Get all profile_photo values from the database
    const dbResult = await pool.query('SELECT profile_photo FROM dosen WHERE profile_photo IS NOT NULL');

    // Create a set of filenames that are in the database
    const databaseFiles = new Set();
    dbResult.rows.forEach(row => {
      if (row.profile_photo) {
        databaseFiles.add(row.profile_photo);
      }
    });

    console.log(`Found ${databaseFiles.size} profile photos in database`);

    // Read all files from uploads directory
    fs.readdir(uploadsDir, (err, files) => {
      if (err) {
        console.error('Error reading uploads directory:', err);
        return;
      }

      // Loop through each file in the directory
      files.forEach(file => {
        // If the file is not in the database, delete it
        if (!databaseFiles.has(file)) {
          const filePath = path.join(uploadsDir, file);

          // Skip default profile picture if it exists
          if (file === '/profile.jpg') return;

          // Delete the file
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting file ${file}:`, err);
            } else {
              console.log(`Deleted unused file: ${file}`);
            }
          });
        }
      });
    });

    console.log('Cleanup complete');
  } catch (error) {
    console.error('Error during uploads cleanup:', error);
  }
};

// Upload gambar ke server
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
// Add this after your other setups

// Run cleanup every 24 hours
setInterval(cleanupUnusedUploads, 24 * 60 * 60 * 1000);

// Also run once when the server starts
cleanupUnusedUploads();
// Endpoint untuk meng-upload foto profil
app.post('/upload-profile-picture', upload.single('profile_picture'), async (req, res) => {
  const { userId } = req.body;
  const filePath = `/uploads/${req.file.filename}`;

  try {
    await client.query(
      'UPDATE users SET profile_picture = $1 WHERE id = $2',
      [filePath, userId]
    );
    res.status(200).send('Profile picture updated successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating profile picture');
  }
});

// JWT Secret Key from environment variables for better security
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret'; // Use a strong secret key

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user; // Attach user info to the request
    next();
  });
};
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    // Add detailed logging
    console.log('Received user ID from token:', req.user.id);
    console.log('Received user email from token:', req.user.email);

    const query = 'SELECT id, nama, nip, email, fakultas, program_studi, profile_photo FROM dosen WHERE id = $1';

    // Log the actual query being executed
    console.log('Executing query with ID:', req.user.id);

    const result = await pool.query(query, [req.user.id]);

    // Log the query result
    console.log('Query result rows:', result.rows);
    console.log('Number of rows found:', result.rows.length);

    let user;

    if (result.rows.length === 0) {
      // Return a default user object with placeholder values if no user is found
      user = {
        nama: '',
        nip: '',
        email: req.user.email || '',
        fakultas: '',
        program_studi: '',
        profile_photo: '../profile.jpg'
      };

      console.log('No profile found. Returning default user object');
    } else {
      user = result.rows[0];

      // Check if the user has a profile photo
      if (user.profile_photo) {
        user.profile_photo = `/uploads/${user.profile_photo}`; // Serve the image from the uploads directory
      } else {
        user.profile_photo = '../profile.jpg'; // Default image if no profile photo exists
      }

      console.log('Profile found:', user);
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Detailed error fetching profile:', error);
    res.status(500).json({
      message: 'Failed to fetch profile',
      errorDetails: error.message,
      stack: error.stack
    });
  }
});

// Register route for creating new users
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if user already exists
    const checkUser = await pool.query('SELECT * FROM login WHERE email = $1', [email]);

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // In registration route
    const result = await pool.query(
      'INSERT INTO login (email, password) VALUES ($1, $2) RETURNING id',
      [email, hashedPassword]
    );
    const userId = result.rows[0].id; // This is now a UUID


    res.status(201).json({
      message: 'Registration successful',
      user: { email: result.rows[0].email },
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login route for authenticating users
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const query = 'SELECT * FROM login WHERE email = $1';
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }

    const user = result.rows[0];

    // Compare the password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { email: user.email },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Add a test endpoint to verify static file serving
app.get('/api/test-uploads', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const fileInfo = files.map(file => {
      const filePath = path.join(uploadsDir, file);
      try {
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          url: `/uploads/${file}`,
          fullPath: filePath,
          exists: fs.existsSync(filePath)
        };
      } catch (err) {
        return {
          name: file,
          error: err.message
        };
      }
    });

    res.json({
      uploadsDir,
      fileCount: files.length,
      files: fileInfo
    });
  });
});

app.post('/api/profile/update', authenticateToken, upload.single('profile_photo'), async (req, res) => {
  const { nama, nip, email, fakultas, program_studi } = req.body;
  const userId = req.user.id; // Extract user ID for clarity

  // Store just the filename instead of the full path
  const photoFilename = req.file ? req.file.filename : null;

  // Input validation
  if (!nama || !nip || !email || !fakultas || !program_studi) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user exists in dosen table
    const checkQuery = 'SELECT * FROM dosen WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [userId]);

    let result;
    if (checkResult.rows.length === 0) {
      // Insert new user if not found
      const insertQuery = `
        INSERT INTO dosen (id, nama, nip, email, fakultas, program_studi, profile_photo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      result = await pool.query(insertQuery, [userId, nama, nip, email, fakultas, program_studi, photoFilename]);
    }
    else {
      // Update existing user
      const updateQuery = `
        UPDATE dosen
        SET id = $1, nama = $2, nip = $3, email = $4, fakultas = $5, program_studi = $6, profile_photo = $7, updated_at = NOW()
        WHERE id = $8 RETURNING *`;

      result = await pool.query(updateQuery, [userId, nama, nip, email, fakultas, program_studi, photoFilename, userId]);
    }
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// Helper function to get the actual column name with correct casing from the database
// Helper function to convert aspect name to database column name
const aspectToColumnName = (aspectName) => {
  return aspectName
    .replace(/\s+/g, '_')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
};
 
// Helper function to properly quote identifiers (table names, column names)
// to handle reserved keywords and special characters
const quoteIdentifier = (identifier) => {
  // Wrap the identifier in double quotes to make it safe for PostgreSQL
  return `"${identifier}"`;
};
 
// Helper function to map category title to table name
const getCategoryTableName = (categoryTitle) => {
  const tableMapping = {
    'Penguasaan Materi': 'penguasaan_materi',
    'Celah Keamanan': 'celah_keamanan',
    'Fitur Utama': 'fitur_utama',
    'Fitur Pendukung': 'fitur_pendukung'
  };
 
  return tableMapping[categoryTitle] || null;
};
 
// Helper function to check if a column exists in a table (case insensitive)
const columnExists = async (tableName, columnName) => {
  try {
    const result = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = $1 AND LOWER(column_name) = LOWER($2)`,
      [tableName, columnName]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking if column exists:', error);
    throw error;
  }
};
 
// Helper function to get the actual column name with correct casing from the database
const getActualColumnName = async (tableName, columnNameLower) => {
  try {
    const result = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = $1 AND LOWER(column_name) = LOWER($2)`,
      [tableName, columnNameLower]
    );
 
    if (result.rows.length > 0) {
      return result.rows[0].column_name; // Return the actual column name with correct casing
    }
    return null; // Column not found
  } catch (error) {
    console.error('Error getting actual column name:', error);
    throw error;
  }
};
// Add a new column to an existing table
app.post('/api/schema/add-column', authenticateToken, async (req, res) => {
  const { categoryTitle, aspectName } = req.body;
  
  if (!categoryTitle || !aspectName) {
    return res.status(400).json({ message: 'Category title and aspect name are required' });
  }
  
  const tableName = getCategoryTableName(categoryTitle);
  
  if (!tableName) {
    return res.status(400).json({ message: 'Invalid category title' });
  }
  
  const columnName = aspectToColumnName(aspectName);
  
  try {
    // Check if the column already exists
    const exists = await columnExists(tableName, columnName);
    
    if (exists) {
      return res.status(400).json({ message: `Column '${columnName}' already exists in table '${tableName}'` });
    }
    
    // Add the new column - use quoted identifiers to handle reserved keywords
    const quotedTableName = quoteIdentifier(tableName);
    const quotedColumnName = quoteIdentifier(columnName);
    
    await pool.query(`ALTER TABLE ${quotedTableName} ADD COLUMN ${quotedColumnName} INTEGER DEFAULT 0`);
    
    res.status(200).json({
      message: 'Column added successfully',
      details: {
        tableName,
        columnName,
        originalAspectName: aspectName
      }
    });
  } catch (error) {
    console.error('Error adding column:', error);
    res.status(500).json({ 
      message: 'Failed to add column', 
      error: error.message 
    });
  }
});

// Rename an existing column
app.put('/api/schema/rename-column', authenticateToken, async (req, res) => {
  const { categoryTitle, oldAspectName, newAspectName } = req.body;
  
  if (!categoryTitle || !oldAspectName || !newAspectName) {
    return res.status(400).json({ message: 'Category title, old aspect name, and new aspect name are required' });
  }
  
  const tableName = getCategoryTableName(categoryTitle);
  
  if (!tableName) {
    return res.status(400).json({ message: 'Invalid category title' });
  }
  
  const oldColumnName = aspectToColumnName(oldAspectName);
  const newColumnName = aspectToColumnName(newAspectName);
  
  try {
    // Check if the old column exists
    const oldExists = await columnExists(tableName, oldColumnName);
    
    if (!oldExists) {
      return res.status(404).json({ message: `Column '${oldColumnName}' does not exist in table '${tableName}'` });
    }
    
    // Check if the new column name already exists
    if (oldColumnName !== newColumnName) {
      const newExists = await columnExists(tableName, newColumnName);
      
      if (newExists) {
        return res.status(400).json({ message: `Column '${newColumnName}' already exists in table '${tableName}'` });
      }
    }
    
    // Rename the column - use quoted identifiers to handle reserved keywords
    const quotedTableName = quoteIdentifier(tableName);
    const quotedOldColumnName = quoteIdentifier(oldColumnName);
    const quotedNewColumnName = quoteIdentifier(newColumnName);
    
    await pool.query(`ALTER TABLE ${quotedTableName} RENAME COLUMN ${quotedOldColumnName} TO ${quotedNewColumnName}`);
    
    res.status(200).json({
      message: 'Column renamed successfully',
      details: {
        tableName,
        oldColumnName,
        newColumnName,
        originalOldAspectName: oldAspectName,
        originalNewAspectName: newAspectName
      }
    });
  } catch (error) {
    console.error('Error renaming column:', error);
    res.status(500).json({ 
      message: 'Failed to rename column', 
      error: error.message 
    });
  }
});

// Delete an existing column
app.delete('/api/schema/delete-column', authenticateToken, async (req, res) => {
  const { categoryTitle, aspectName } = req.body;
  
  if (!categoryTitle || !aspectName) {
    return res.status(400).json({ message: 'Category title and aspect name are required' });
  }
  
  const tableName = getCategoryTableName(categoryTitle);
  
  if (!tableName) {
    return res.status(400).json({ message: 'Invalid category title' });
  }
  
  const columnName = aspectToColumnName(aspectName);
  
  try {
    // Check if the column exists
    const exists = await columnExists(tableName, columnName);
    
    if (!exists) {
      return res.status(404).json({ message: `Column '${columnName}' does not exist in table '${tableName}'` });
    }
    
    // Delete the column - use quoted identifiers to handle reserved keywords
    const quotedTableName = quoteIdentifier(tableName);
    const quotedColumnName = quoteIdentifier(columnName);
    
    await pool.query(`ALTER TABLE ${quotedTableName} DROP COLUMN ${quotedColumnName}`);
    
    res.status(200).json({
      message: 'Column deleted successfully',
      details: {
        tableName,
        columnName,
        originalAspectName: aspectName
      }
    });
  } catch (error) {
    console.error('Error deleting column:', error);
    res.status(500).json({ 
      message: 'Failed to delete column', 
      error: error.message 
    });
  }
});

// Updated grade-submit with proper handling of reserved keywords
app.post('/api/grade-submit', authenticateToken, async (req, res) => {
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

// Update grades fetch endpoint to handle reserved keywords properly
app.get('/api/grades', authenticateToken, async (req, res) => {
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



// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});