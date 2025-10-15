import mysql from "mysql2/promise";
import {createUnverifiedUserTable} from "../models/unverifiedUser";
import { createAuthProvidersTable } from "../models/authProviders";
//require('dotenv').config();
import {db} from "../config/config"
import { createEmailTokensTable } from "../models/email_tokens";
import { createUserTable } from "../models/user";
const pool = mysql.createPool({
  host: db.DB_HOST ,
  user: db.DB_USER ,
  password: db.DB_PASS ,
  database: db.DB_NAME ,
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
    await createUserTable();
  console.log("created  User table");
    await createUnverifiedUserTable();
  console.log("created Unverified User");
  await createAuthProvidersTable();
  console.log("created Verified User");
  await createEmailTokensTable()
  console.log("created tokens table");
  
  } catch (err) {
    console.log("error init database tables ", err);
  }
  
}
export default pool;
