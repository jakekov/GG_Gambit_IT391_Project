import pool from "../databases/mysql";
import { RowDataPacket } from "mysql2";
import { UserNotFoundError } from "../errors";

export interface UnverifiedUser extends RowDataPacket {
  token: string;
  email: string;

  hash: string;
  salt: string;
  created: string;
}
async function getUserByToken(token: string) {
  const [rows] = await pool.query<UnverifiedUser[]>(
    "SELECT * FROM unverified_users WHERE id = ?",
    [token],
  );
  return rows;
}
export async function getUserByUsername(username: string) {
  const [rows] = await pool.query<UnverifiedUser[]>(
    "SELECT * FROM unverified_users WHERE username = ?",
    [username],
  );
  return rows;
}
export async function getUserByEmail(email: string) {
  const [rows] = await pool.query<UnverifiedUser[]>(
    "SELECT * FROM unverified_users WHERE email = ?",
    [email],
  );
  return rows;
}

async function createUser(
  hash: string,
  email: string,
  token: string,
  salt: string,
) {
  const [result] = await pool.query(
    "INSERT INTO unverified_users (hash, email, token, salt) VALUES (?, ?, ?, ?)",
    [hash, email, token, salt],
  );
  return result;
}
//since token is just hmac it is possible for two users info to collide but you can just resend verification
async function removeUser(token: string) {
  const [result] = await pool.query(
    "DELETE FROM unverified_users WHERE token = ?",
    [token],
  );
  return result;
}
export default {
  getUserByToken,
  getUserByEmail,
  getUserByUsername,
  createUser,
  removeUser,
};
