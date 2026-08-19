const mysql = require('mysql2');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};

const dbName = process.env.DB_NAME || 'taskhub';

const pool = mysql.createPool({ ...config, database: dbName });
const adminPool = mysql.createPool(config);

const promisePool = pool.promise();
const adminPromisePool = adminPool.promise();

const query = (sql, params = []) => {
  return promisePool.query(sql, params).then(([rows]) => rows);
};

const getOne = (sql, params = []) => {
  return promisePool.query(sql, params).then(([rows]) => rows[0]);
};

const run = (sql, params = []) => {
  return promisePool.query(sql, params).then(([result]) => ({
    id: result.insertId,
    changes: result.affectedRows
  }));
};

const exec = (sql) => {
  return promisePool.query(sql).then(() => {});
};

async function ensureDatabase() {
  const [rows] = await adminPromisePool.query(
    "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
    [dbName]
  );
  if (rows.length === 0) {
    await adminPromisePool.query(`CREATE DATABASE ??`, [dbName]);
    console.log(`Database '${dbName}' created.`);
  }
}

module.exports = {
  pool,
  query,
  getOne,
  run,
  exec,
  ensureDatabase
};
