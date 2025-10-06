//database calls for users

import pool from "../databases/mysql";
import { RowDataPacket } from "mysql2";
import { UnverifiedUser } from "./unverifiedUser";

export async function createVerifiedUserTable() {
  let query = `CREATE TABLE IF NOT EXISTS users(
  id int PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  hash VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

)`
  await pool.query(query); 
}
export interface AuthUser extends RowDataPacket {
  id: number;
  email: string;
  username: string;
  hash: string;
  salt: string;
  created: string;
}
//use Pick<> Omit<> and Partial to get variations

async function getUserById(id: number) {
  const [rows] = await pool.query<AuthUser[]>(
    "SELECT * FROM users WHERE id = ?",
    [id],
  );
  return rows;
}
export async function getUserByUsername(username: string) {
  const [rows] = await pool.query<AuthUser[]>(
    "SELECT * FROM users WHERE username = ?",
    [username],
  );
  return rows;
}
export async function getUserByEmail(email: string) {
  const [rows] = await pool.query<AuthUser[]>(
    "SELECT * FROM users WHERE email = ?",
    [email],
  );
  return rows;
}
 async function getByIndexedEmail<K extends keyof AuthUser>(
    email: string,
    columns: K[],
 ): Promise<Pick<AuthUser, K>[]> {
  const cols = columns.join(", ");
  const sql = 'SELECT ${cols} FROM users WHERE email = ?';
  const [rows] = await pool.query<AuthUser[]>(sql, [email]);
  return rows as Pick<AuthUser,K>[];
 }

async function createUser(verified_user: UnverifiedUser, username: String) {
  const [result] = await pool.query(
    "INSERT INTO users (email, hash, salt, username) VALUES (?, ?, ?, ?)",
    [
      verified_user.email,
      verified_user.hash,
      verified_user.salt,
      username,
    ],
  );
  return result;
}

export default { getUserById, getUserByEmail, getUserByUsername, createUser };
