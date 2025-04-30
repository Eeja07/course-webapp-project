// routes/schema.js - Schema modification routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { 
  aspectToColumnName, 
  quoteIdentifier, 
  getCategoryTableName, 
  columnExists 
} = require('../utils/columnHelpers');

// Add a new column to an existing table
router.post('/add-column', authenticateToken, async (req, res) => {
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
router.put('/rename-column', authenticateToken, async (req, res) => {
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
router.delete('/delete-column', authenticateToken, async (req, res) => {
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

module.exports = router;