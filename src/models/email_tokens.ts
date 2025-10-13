import pool from "../databases/mysql";
import { RowDataPacket } from "mysql2";
import { UserNotFoundError } from "../errors";

//the hash might not be necessary
//if they somehow get access to db couldnt they just set the token to what they want
//
export async function createUnverifiedUserTable() {
  let query = `CREATE TABLE IF NOT EXISTS email_tokens(
  token_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

)`
}
export interface EmailUserToken extends RowDataPacket {
  token: string;
  email: string;
  created: string;
}