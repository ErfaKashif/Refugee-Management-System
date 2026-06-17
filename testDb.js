// testDb.js
require('dotenv').config();
const oracledb = require('oracledb');

try {
  oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\instantclient_23_0' });
  console.log('✅ Thick mode enabled');
} catch (err) {
  console.error('Thick mode init error:', err);
}

const { getConnection } = require('./config/db');

const test = async () => {
  let conn;
  try {
    conn = await getConnection();
    
    // Check connected user
    const user = await conn.execute(
      `SELECT USER FROM DUAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('Connected as:', user.rows[0]);

    // Check total refugee count
    const count = await conn.execute(
      `SELECT COUNT(*) AS TOTAL FROM REFUGEE`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('Total refugees in DB:', count.rows[0]);

    // Check refugees by shelter
    const byShelter = await conn.execute(
      `SELECT SHELTER_ID, COUNT(*) AS TOTAL 
       FROM REFUGEE 
       GROUP BY SHELTER_ID 
       ORDER BY SHELTER_ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('Refugees by shelter:', byShelter.rows);

    // Check shelter 17 specifically
    const shelter17 = await conn.execute(
      `SELECT REFUGEE_ID, NAME, SHELTER_ID 
       FROM REFUGEE 
       WHERE SHELTER_ID = 17`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('Shelter 17 refugees:', shelter17.rows);

  } catch(err) {
    console.error('Test error:', err.message);
  } finally {
    if(conn) await conn.close();
  }
};

test();