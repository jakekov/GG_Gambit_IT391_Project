import pool from '../databases/mysql.js';
import {FieldPacket, RowDataPacket} from 'mysql2';

//keeping this extracted means an account can have multiple
//but it would need a uniaue constraitn on simething by doing something like seasons or like fantasy league
//thise should just be used to count totals information
//actual bets should be in a seperate table
export async function createTeamBetTable() {
  let query = `CREATE TABLE IF NOT EXISTS match_bet(
  id int PRIMARY KEY AUTO_INCREMENT,
  user_id BINARY(16) NOT NULL,
  match_id int NOT NULL
  prediction CHAR(1) NOT NULL,
  bet int NOT NULL,
  payout NOT NULL,
  ended boolean NOT NULL DEFAULT 0,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
  await pool.query(query);
}
export interface MatchBet extends RowDataPacket {
  id: number;
  user_id: Buffer;
  match_id: number;
  prediction: string; //char 1
  bet: number;
  payout: number;
  ended: boolean; //tells if it should look in match results
  created: string;
}
export interface MatchBetOptions {
  user_id: Buffer;
  match_id: number;
  prediction: string; //char 1
  bet: number;
  payout: number;
}

async function getInfoByUuid(uuid: Buffer) {
  const [rows] = await pool.query<MatchBet[]>(
    'SELECT * FROM match_bet_info WHERE user_id = ?',
    [uuid]
  );
  return rows;
}

//get info by uuid then update from the primary key id, i think id should be indexed
async function updatePoints(points: number, id: number) {
  const [rows] = await pool.query(
    'UPDATE match_bet_info SET points = ? WHERE id = ?',
    [points, id]
  );
  return rows;
}
async function createUserBetInfo(options: MatchBetOptions) {
  const [result] = await pool.query(
    'INSERT INTO match_bet_info (user_id, match_id, prediction, bet, payout) VALUES (?,?,?,?,?)',
    [
      options.user_id,
      options.match_id,
      options.prediction,
      options.bet,
      options.payout,
    ]
  );
  return result;
}
export default {createUserBetInfo, updatePoints, getInfoByUuid};
