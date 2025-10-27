//for whatever reason the api doesnt give a way to convert teams to ids
// the api also only gives recently played teams so im guessing only teams in matches / results
//so this needs to get updated everytime we fetch new matches
import pool from '../databases/mysql.js';
import {FieldPacket, RowDataPacket} from 'mysql2';

export async function createStaticTeamsTable() {
  let query = `CREATE TABLE IF NOT EXISTS static_teams(
  id int PRIMARY KEY,
  name VARCHAR(32) NOT NULL,
  country VARCHAR(32) NOT NULL,
  img VARCHAR(64),
  UNIQUE(name, country)
)`;
  await pool.query(query);
}
export interface StaticTeam extends RowDataPacket {
  id: number; //vlr.gg key
  name: string;
  country: string;
  img: string | null; //owcdn link for picture
}
export interface StaticTeamOptions {
  id: number; //vlr.gg key
  name: string;
  country: string;
  img: string | null; //owcdn link for picture
}

async function getTeamByUniqueName(name: string, country: string) {
  const [rows] = await pool.query<StaticTeam[]>(
    'SELECT * FROM static_teams WHERE name = ? AND country = ?',
    [name, country]
  );
  return rows;
}
async function getTeamById(id: number) {
  const [rows] = await pool.query<StaticTeam[]>(
    'SELECT * FROM static_teams WHERE id = ?',
    [id]
  );
  return rows;
}

//want more info go through the scraper to get players
async function createStaticTeam(options: StaticTeamOptions) {
  const [result] = await pool.query(
    'INSERT INTO static_teams (id, name, country, img) VALUES (?,?,?,?)',
    [options.id, options.name, options.country, options.img]
  );
  return result;
}
export default {getTeamByUniqueName, getTeamById, createStaticTeam};
