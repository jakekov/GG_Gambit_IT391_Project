//database calls for users

import pool from "../databases/mysql";
import { RowDataPacket } from "mysql2";
import { UnverifiedUser } from "./unverifiedUser";

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

async function createUser(verified_user: UnverifiedUser, username: String) {
  const [result] = await pool.query(
    "INSERT INTO users (hash, email, hash, salt, username) VALUES (?, ?, ?, ?, ?)",
    [verified_user.hash, verified_user.email, verified_user.hash, verified_user.salt, username],
  );
  return result;
}

export default { getUserById, getUserByEmail, getUserByUsername, createUser };
