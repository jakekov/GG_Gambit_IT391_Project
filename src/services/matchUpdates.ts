//in charge of keeping track when the server is updating matches / match status
// routes can use this to schedule when a match should update

import match_model, {Match, MatchStatus} from '@/models/matches.js';
import results_model, {ResultOptions} from '@/models/match_results.js';
import bet_model, {MatchBet} from '@/models/match_bet.js';
import info_model from '@/models/userBetInfo.js';
import pool from '@/databases/mysql.js';
import schedule from 'node-schedule';
import config from '@/config/config.js';
import {
  schedule_conclusion_check,
  schedule_live_check,
} from './taskInterface.js';
export interface VlrMatches {
  status: string;
  size: number;
  data: VlrMatch[];
}
export interface VlrMatch {
  id: string;
  teams: VlrTeam[];
  status: string;
  event: string;
  tournament: string;
  img: string;
  ago?: string; //Result specific
  in?: string; //match specific
  timestamp?: number; //match specific
}
export interface DirectResponse {
  status: string;
  data: DirectVlrMatch;
}
export interface DirectVlrMatch {
  teams: VlrTeam[];
  status: string;
  event: string;
  tournament: string;
  img: string;
  utcDate: string; //match specific
  won?: boolean;
}
export interface VlrTeam {
  name: string;
  country: string;
  score: string | null; //null if upcoming status
  won?: boolean; //result specific
}
export async function startupMatchSchedules() {
  try {
    console.log(`CONFIG WHYYY ${config.scraper_url}`);
    console.log(config);
    await checkConclusions();
    await rebuildUpcomingMatchSchedules(); //this will scheduele any upcoming matches to check if the match has started
    await updateAllMatchBets();
    schedule.scheduleJob('*/5 * * * *', async () => await checkConclusions()); //check for ended matches every 5 minutes
  } catch (err) {
    console.log(err);
  }
}
//run this after checking for upcoming matches to live matches
async function rebuildUpcomingMatchSchedules() {
  //when server restarts i need to reschedule updates for
  //updating matches from upcoming to live (go through database and check each one, i could also find orphans here)
  //checking if live matches ended
  //retrieve matches
  let our_upcoming_promise = match_model.getMatchesByStatus(
    MatchStatus.upcoming
  );
  const response = await fetch(`${config.scraper_url}/api/v1/matches`)
    .then((res1) => {
      if (!res1.ok) {
        console.log(res1);
        throw new Error('Failed to fetch scraper api matches');
      }
      return res1.json();
    })
    .then((res1) => {
      return res1 as VlrMatches;
    });
  let upcoming_matches = await our_upcoming_promise;
  if (upcoming_matches.length == 0) return; //nothing to rebuild
  const match_ids: number[] = [];
  for (const match of upcoming_matches) {
    match_ids.push(match.id);
  }
  for (const vlr_match of response.data) {
    const id = parseInt(vlr_match.id);
    let idx = match_ids.indexOf(id);
    if (idx >= 0) {
      //it exists in matches
      //than it means its a upcoming match or live match but we have it as an upcoming( ie it just started)
      let executionTime = new Date(
        upcoming_matches[idx].match_start.getTime() + 2000 // plus 20 seconds so its more likely that we dont have to check again
      );
      await startUpcomingMatchSchedule(id, executionTime);
    }
  }
}
/**
 * Checks if any current live matches exists if not it means its ended
 * Queries vlr results to get end info and moves the match from matches to results table
 * Emits an event with the match id so a system can update bets
 * @param live_matches Matches in matches table that have MachStatus Live
 * @param matches All vlr_match ids returned from api/v1/matches
 * @returns
 */
//need to test for orphaned match data somewhere else if we have a match in matches table that doesnt exist in results but it should be finished
async function checkConclusions() {
  //this should really just be checking a single match but then id have to make an scraping api for a single match
  //for each live match check if it exists in number
  //number is only like 40 long so just do array although in javascript im not sure how well that would translate

  //make the promise here so the web fetch can start aswell

  const live_matches_promise = match_model.getAllMatches();
  const live_matches = await live_matches_promise;
  if (live_matches.length == 0) return;
  const response = await fetch(`${config.scraper_url}/api/v1/results`)
    .then((res1) => {
      if (!res1.ok) {
        console.log(res1);
        throw new Error('Failed to fetch scraper api results');
      }
      return res1.json();
    })
    .then((res) => {
      return res as VlrMatches;
    });

  for (const match of live_matches) {
    //vlr results should only have finished matches
    for (const vlr_result of response.data) {
      if (parseInt(vlr_result.id) !== match.id) continue;
      //found a match in results
      //remove the entry from the matches and put it into results with updated info
      let a = vlr_result.teams[0].score;
      let b = vlr_result.teams[1].score;
      if (a == null || b == null) {
        console.log('return result equals');
        console.log(match);
        console.log(vlr_result);
        continue;
      }
      //use a transaction so we dont lose any match data if anything fails
      let options: ResultOptions = {
        score_a: parseInt(a),
        score_b: parseInt(b),
        event: vlr_result.event,
        tournament: vlr_result.tournament,
        img: vlr_result.img,
      };
      const con = await pool.getConnection();
      await con.beginTransaction();
      try {
        await match_model.removeMatch(match.id, con);

        await results_model.createResultRow(match, options, con);
        await con.commit();
      } catch (err) {
        console.log('rollback');
        console.log(err);
        await con.rollback();
        continue;
      } finally {
        con.release();
      }
      //todo emit an event for updating peoples bets
      //or just do it here since this is being run async in schedule
      console.log(`ended match ${match.id}`);
      await endMatchBetUpdates(
        match.id,
        options.score_a > options.score_b ? 'a' : 'b'
      );
      break;
    }
  }
}
async function updateAllMatchBets() {
  console.log('updating all active bets');
  const bets = await bet_model.allActiveBets();
  for (const bet of bets) {
    const result = await results_model.getResultById(bet.match_id);
    if (result.length == 0) {
      const existing_match = await match_model.getMatchById(bet.match_id);
      if (existing_match.length == 0) {
        console.log(
          `bet ${bet.id} does not have a finished match do something about it`
        );
      }

      continue;
    }
    const match = result[0];
    await updateUserBet(bet, match.score_a > match.score_b ? 'a' : 'b');
  }
}
async function endMatchBetUpdates(match_id: number, winner: string) {
  const bets_on_match = await bet_model.getBetsByMatch(match_id);
  for (const bet of bets_on_match) {
    await updateUserBet(bet, winner);
  }
}
/**
 * This needs to only be run by one task
 * @param bet
 * @param winner
 * @returns
 */
async function updateUserBet(bet: MatchBet, winner: string) {
  if (bet.ended) return; //this shoudlnt happen unless this is called multiple times for a single match which shouldnt happen
  let info = await info_model.getInfoByUuid(bet.user_id);
  const con = await pool.getConnection();
  await con.beginTransaction();

  try {
    var points = bet.payout;
    const bet_won = bet.prediction === winner ? true : false;
    if (bet_won) {
      points *= 2.5;
      await info_model.addbalance(bet.payout, info[0].id, con);
    }
    //move this to the end so if any errors applying the points or balance it doesnt set the bet to ended
    await info_model.updatePoints(Math.round(points), info[0].id, con);
    await bet_model.betConcluded(bet.id, bet_won, points, con);
    await con.commit();
    console.log(`updated bet ${bet.bet}`);
  } catch (err) {
    console.log('rollback');
    console.log(err);
    await con.rollback();
  } finally {
    con.release();
  }
}
/**
 * Starts a schedule to check for any matches that have started.
 * it runs at the execution time and will retry in a minute if the given match id was not updated
 * @param for_match_id valid match id for the match we want to check live status of
 * @param execution_time any valid date object This checks for already passed times and schedules it to run in 5 seconds
 */
export async function startUpcomingMatchSchedule(
  for_match_id: number,
  execution_time: Date
) {
  //move this here so we dont accidentally create a bunch of schedules and so checkUpcoming isnt exposed
  if (Date.now() >= execution_time.getTime()) {
    console.log(
      `match  ${for_match_id} start ${execution_time} is less than now`
    );
    //so use Date.now() pus 5 to get the update loop started if it already isnt
    execution_time.setTime(Date.now() + 5000);
  }
  console.log(`scheduled live check for ${execution_time} id ${for_match_id}`);
  schedule.scheduleJob(
    execution_time,
    async () => await updateMatch(for_match_id, 0)
  );
}

async function updateMatch(for_match_id: number, failed_attempts: number) {
  const match_p = match_model.getMatchById(for_match_id);
  const response = await fetch(
    `${config.scraper_url}/api/v1/matches/${for_match_id}`
  )
    .then((res1) => {
      if (!res1.ok) {
        console.log(res1);
        throw new Error('Failed to fetch scraper api matches');
      }
      return res1.json();
    })
    .then((res1) => {
      return res1 as DirectResponse;
    });

  //match date should now always be when the match should start so base reschedules off of it
  //unless Date.now is greater than match_start
  let now = new Date(Date.now());

  const match_date = new Date(response.data.utcDate);
  let year = now.getFullYear();
  if (now.getMonth() < match_date.getMonth()) {
    //if current month is less than match_date
    //it means its in the previous year
    //
    year -= 1;
  } else if (now.getMonth() > match_date.getMonth()) {
    year += 1;
    //if the current month is greater than the match date than its in the next year now december match in january
  }
  match_date.setFullYear(year);
  const [match] = await match_p; //juts get first element
  if (!match) {
    console.log(`match was not found canceling update ${for_match_id}`);
    return;
  }
  if (match.match_start.getTime() !== match_date.getTime()) {
    console.log(
      `match_start for match ${match.id} changed to ${match_date.toISOString()}`
    );
    failed_attempts = 0; //reset failed attempts if the time changes
    await match_model.updateMatchStart(match.id, match_date);
    //this needs to reschedule for a different time potentially
    //match.match_start.setTime(match_date.getTime()); // this match object doesnt persist so changing it is okay
    //
  }
  if (match.status === MatchStatus.live) {
    //the match is already live continue to next
    //but we need to make sure we stop propogating schedule checks
    return;
  }
  if ((response.status as MatchStatus) === MatchStatus.live) {
    await match_model.updateMatchStatus(match.id, MatchStatus.live);
    console.log(`updating match status to live ${match.id}`);
    //schedule a check for when we think the match would end
    //i think most matches are best of 3 so like hour and a half maybe
    schedule_conclusion_check(
      for_match_id,
      new Date(Math.max(match_date.getTime(), Date.now()) + 324000000)
    );
    return;
  }
  //if match status is not live yet reschedule to run again
  if (for_match_id < 0 || failed_attempts < 0) {
    return; //call was intended to run once and immedietly
  }
  if (failed_attempts > 20) {
    console.log(
      `Match ${for_match_id} Failed to update to live do somethign about it`
    );
    return;
  }
  //check if the match_start changed
  const base_time =
    match_date.getTime() < Date.now() ? Date.now() : match_date.getTime();
  //this is needed if its rescheduled
  //if the match still hasnt starter and now has passes use now
  let execution_time = new Date(
    base_time + 60000 + Math.pow(2, Math.min(failed_attempts, 5) * 10000) //6 minute updates after 5 attempts
  ); // add a minute and try again
  schedule_live_check(for_match_id, execution_time, failed_attempts + 1);
}
