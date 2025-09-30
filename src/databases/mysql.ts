import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "remote_user",
  password: process.env.DB_PASS || "ab12cd34",
  database: process.env.DB_NAME || "mydb",
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

export default pool;
