// resetAdmin.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const oracledb = require('oracledb');

try {
  oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\instantclient_23_0' });
} catch(e) {}

const { getConnection } = require('./config/db');

const resetPassword = async () => {
  let conn;
  const username    = 'admin_main';     // your admin username
  const newPassword = 'admin123';       // set whatever password you want

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    console.log('New hash:', hashed);

    conn = await getConnection();

    await conn.execute(
      `UPDATE USERS SET PASSWORD = :pwd WHERE USERNAME = :usr`,
      { pwd: hashed, usr: username },
      { autoCommit: true }
    );

    console.log('✅ Password reset successfully');
    console.log('Username:', username);
    console.log('Password:', newPassword);

  } catch(err) {
    console.error('Error:', err.message);
  } finally {
    if (conn) await conn.close();
  }
};

resetPassword();