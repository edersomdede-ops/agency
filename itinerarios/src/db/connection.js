// src/db/connection.js
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'itinerarios.db');

function openDatabase() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA journal_mode = WAL');
  return db;
}

module.exports = { openDatabase, DB_PATH };
