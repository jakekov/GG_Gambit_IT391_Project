//in charge of keeping track when the server is updating matches / match status
// routes can use this to schedule when a match should update

import match_model, {MatchStatus} from '@/models/matches.js';
import results_model, {ResultOptions} from '@/models/match_results.js';
import bet_model from '@/models/match_bet.js';
import info_model from '@/models/userBetInfo.js';
import pool from '@/databases/mysql.js';
import schedule from 'node-schedule';
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
export interface VlrTeam {
  name: string;
  country: string;
  score: string | null; //null if upcoming status
  won?: boolean; //result specific
}
export async function startupMatchSchedules() {
  await checkConclusions();
  await rebuildUpcomingMatchSchedules(); //this will scheduele any upcoming matches to check if the match has started
  schedule.scheduleJob('*/5 * * * *', checkConclusions); //check for ended matches every 5 minutes
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
  const response = await fetch('http://10.111.21.84:5000/api/v1/matches')
    .then((res1) => res1.json())
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
      startUpcomingMatchSchedule(id, executionTime);
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

  const live_matches_promise = match_model.getMatchesByStatus(MatchStatus.live);
  const live_matches = await live_matches_promise;
  if (live_matches.length == 0) return;
  console.log('checking for ended matches');
  const response = await fetch('http://10.111.21.84:5000/api/v1/results')
    .then((res) => res.json())
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
      } finally {
        con.release();
      }
      //todo emit an event for updating peoples bets
      //or just do it here since this is being run async in schedule
      endMatchBetUpdates(
        match.id,
        options.score_a > options.score_b ? 'a' : 'b'
      );
      break;
    }
  }
}
async function endMatchBetUpdates(match_id: number, winner: string) {
  const bets_on_match = await bet_model.getBetsByMatch(match_id);
  for (const bet of bets_on_match) {
    if (bet.ended) continue; //this shoudlnt happen unless this is called multiple times for a single match which shouldnt happen
    let info = await info_model.getInfoByUuid(bet.user_id);
    const con = await pool.getConnection();
    await con.beginTransaction();

    try {
      var points = bet.payout;

      if (bet.prediction === winner) {
        points *= 2.5;
        await info_model.addbalance(bet.payout, info[0].id, con);
      }
      //move this to the end so if any errors applying the points or balance it doesnt set the bet to ended
      await info_model.updatePoints(Math.round(points), info[0].id, con);
      await bet_model.betConcluded(bet.id, con);
      await con.commit();
    } catch (err) {
      console.log('rollback');
      console.log(err);
      await con.rollback();
    } finally {
      con.release();
    }
  }
}
/**
 * Starts a schedule to check for any matches that have started.
 * it runs at the execution time and will retry in a minute if the given match id was not updated
 * @param for_match_id valid match id for the match we want to check live status of
 * @param execution_time any valid date object This checks for already passed times and schedules it to run in 5 seconds
 */
export function startUpcomingMatchSchedule(
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
  schedule.scheduleJob(execution_time, () => checkUpcoming(for_match_id, 0));
}
/**
 * Checks all of our database upcoming matches and checks vlr to see if they started
 */
export async function checkAllUpcomingMatches() {
  await checkUpcoming(-1, 0);
}
/**
 * Used inside a schedule
 * Goes through vlr_matches and updates any in our database that are upcoming but should be live
 * this should just check vlr.gg for the specific match id but wed need to build a scraper for that
 * so for now it juts checks every match
 * @param for_match_id  Match id its inteded to search for. -1  for a search that doesnt propogate
 * @param failed_attempts
 * @returns
 */
async function checkUpcoming(for_match_id: number, failed_attempts: number) {
  //funciton used for checking if a match is not live
  //should be run in background task scheduled at the timestart of the match + a minute
  //this can also be used in a route incase someone wants to refreshs to get better updates
  //this should check vlr matches and move a match into live status
  //i dont need to worry about double writes in case a con job and route try to do the same thing

  //this should also just use a single match api but it would need to be made
  //but i dont care enough to make it so just scedule this whenever a new upcoming match entry is made
  console.log(`running update check ${for_match_id}`);
  const response = await fetch('http://10.111.21.84:5000/api/v1/matches')
    .then((res1) => res1.json())
    .then((res1) => {
      return res1 as VlrMatches;
    });
  let match_updated = false;
  for (const match of response.data) {
    const team_a = match.teams[0];
    const team_b = match.teams[1];
    if (team_a.name === 'TBD' || team_b.name === 'TBD') continue; //some of them after still have names
    //find match in database from vlr id
    if ((match.status as MatchStatus) != MatchStatus.live) continue;
    //only do checks if its  alive match
    const id = parseInt(match.id);
    const existing_matches = await match_model.getMatchWithTeams(id);
    if (existing_matches.length != 0) {
      if (existing_matches[0].status === MatchStatus.live) {
        //the match is already live continue to next
        //but we need to make sure we stop propogating schedule checks
        if (existing_matches[0].match_id === for_match_id) {
          match_updated = true;
        }
        continue;
      }

      await match_model.updateMatchStatus(
        existing_matches[0].id,
        MatchStatus.live
      );
      if (id === for_match_id) match_updated = true;
    }
  }
  //if the match didnt go live at the expected time retry in a minute
  if (!match_updated) {
    if (for_match_id == -1) {
      return; //call was intended to run once and immedietly
    }
    if (failed_attempts > 20) {
      console.log(
        `Match ${for_match_id} Failed to update to live do somethign about it`
      );
      return;
    }
    let execution_time = new Date(Date.now() + 60000); // add a minute and try again
    schedule.scheduleJob(execution_time, () =>
      checkUpcoming(for_match_id, failed_attempts + 1)
    );
  }
}
