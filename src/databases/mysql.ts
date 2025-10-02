import mysql from "mysql2/promise";
import {createUnverifiedUserTable} from "../models/unverifiedUser";
import { createVerifiedUserTable } from "../models/userModels";
require('dotenv').config();
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "remote_user",
  password: process.env.DB_PASS || "ab12cd34",
  database: process.env.DB_NAME || "test_db",
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});
pool.getConnection()
        .then(connection => {
            console.log('Database connected successfully');
            connection.release(); // Release the connection back to the pool
        })
        .catch(err => {
            console.error('Error connecting to database:', err);
        });

export const create_if_not_exists= async () => {
  console.log("CREATING TABLES");
  try {
    await createUnverifiedUserTable();
  console.log("created Unverified User");
  await createVerifiedUserTable();
  console.log("created Verified User");
  } catch (err) {
    console.log("error init database tables ", err);
  }
  
}
export default pool;
