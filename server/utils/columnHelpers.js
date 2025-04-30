// utils/columnHelpers.js - Database column utilities
const pool = require('../config/db');

// Helper function to convert aspect name to database column name
const aspectToColumnName = (aspectName) => {
  return aspectName
    .replace(/\s+/g, '_')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
};
 
// Helper function to handle reserved keywords and special characters
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

module.exports = {
  aspectToColumnName,
  quoteIdentifier,
  getCategoryTableName,
  columnExists,
  getActualColumnName
};