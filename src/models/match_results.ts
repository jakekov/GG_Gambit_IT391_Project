import pool from '../databases/mysql.js';
import {FieldPacket, RowDataPacket} from 'mysql2';
import {Match, MatchWithTeams} from './matches.js';
import {PoolConnection} from 'mysql2/promise';
//i could maybe just store matches that people placed bets on
// and then only store results from that
//cause the path will be make bet fetches matches you can bet on from the vlr.gg
//placing a bet will add it to this table for reference
//
export async function createMatcheResultsTable() {
  let query = `CREATE TABLE IF NOT EXISTS match_results(
  id int PRIMARY KEY,
  team_a int NOT NULL,
  team_b int NOT NULL,
  score_a int NOT NULL,
  score_b int NOT NULL,
  odds int NOT NULL,
  event VARCHAR(64),
  tournament VARCHAR(64),
  img VARCHAR(64),
  match_end TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
  await pool.query(query);
}
/**
 * Used to store information for matches that have ended
 * vlresports api doesnt have  away to see past matches
 * this table is used for retrival of information for passed matches
 */
export interface Result extends RowDataPacket {
  id: number; //vlr.gg key
  team_a: number; //static teams key
  team_b: number;
  score_a: number;
  score_b: number;
  odds: number; // likelyhood of a team winning INT 0 is 50/50 - team_1,  + team_b divide by some scalar to get percent
  event: string;
  tournament: string;
  img: string;
  match_start: Date;
}
export interface ResultOptions {
  score_a: number;
  score_b: number;
  event: string;
  tournament: string;
  img: string;
}
export interface ResultWithTeams extends RowDataPacket {
  match_id: number;
  a_id: number;
  a_name: string;
  a_img: string;
  a_score: number;
  b_id: number;
  b_name: string;
  b_img: string;
  b_score: number;
  odds: number;
  match_end: Date;
}
async function getResultById(id: number) {
  const [rows] = await pool.query<Result[]>(
    'SELECT * FROM match_results WHERE id = ?',
    [id]
  );
  return rows;
}
async function getResultWithTeams(id: number) {
  const [rows] = await pool.query<ResultWithTeams[]>(
    `SELECT 
      m.id as match_id,
      ta.id as a_id,
      ta.name as a_name,
      ta.img as a_img,
      tb.id as b_id,
      tb.name as b_name,
      tb.img as b_img,
      m.odds,
      m.match_end,
      m.score_a as a_score,
      m.score_b as b_score
      FROM match_results m
      join static_teams ta on m.team_a = ta.id
      join static_teams tb on m.team_b = tb.id
      WHERE m.id = ?
    `,
    [id]
  );
  return rows;
}

//want more info go through the scraper to get players
async function createResultRow(
  options: Match,
  add: ResultOptions,
  con?: PoolConnection
) {
  const db = con ?? pool;
  const [result] = await db.query(
    'INSERT INTO match_results (id, team_a, team_b, score_a, score_b, odds, event, tournament, img) VALUES (?,?,?,?,?,?,?,?,?)',
    [
      options.id,
      options.team_a,
      options.team_b,
      add.score_a,
      add.score_b,
      options.odds,
      add.event,
      add.tournament,
      add.img,
    ]
  );
  return result;
}

export default {getResultById, getResultWithTeams, createResultRow};
