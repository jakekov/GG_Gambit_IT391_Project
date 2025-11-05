import mysql from 'mysql2/promise';
import {createUnverifiedUserTable} from '../models/unverifiedUser.js';
import {createAuthProvidersTable} from '../models/authProviders.js';
//require('dotenv').config();
import {db} from '../config/config.js';
import {createEmailTokensTable} from '../models/email_tokens.js';
import {createUserTable} from '../models/user.js';
import {createUserBetInfoTable} from '../models/userBetInfo.js';
import {createMatchesTable} from '@/models/matches.js';
import {createStaticTeamsTable} from '@/models/staticTeams.js';
import {createMatcheResultsTable} from '@/models/match_results.js';
import {createMatchBetTable} from '@/models/match_bet.js';
const pool = mysql.createPool({
  host: db.DB_HOST,
  user: db.DB_USER,
  password: db.DB_PASS,
  database: db.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});
pool
  .getConnection()
  .then((connection) => {
    console.log('Database connected successfully');
    connection.release(); // Release the connection back to the pool
  })
  .catch((err) => {
    console.error('Error connecting to database:', err);
  });

export const create_if_not_exists = async () => {
  console.log('CREATING TABLES');
  try {
    await createUserTable();
    console.log('created  User table');
    await createUnverifiedUserTable();
    console.log('created Unverified User');
    await createAuthProvidersTable();
    console.log('created Verified User');
    await createEmailTokensTable();
    console.log('created tokens table');
    await createUserBetInfoTable();
    console.log('creating bet info table');
    await createMatchesTable();
    await createStaticTeamsTable();
    await createMatcheResultsTable();
    await createMatchBetTable();
  } catch (err) {
    console.log('error init database tables ', err);
  }
};
export default pool;
