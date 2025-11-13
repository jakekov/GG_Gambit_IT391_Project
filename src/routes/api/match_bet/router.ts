import express, {Request, Response, NextFunction} from 'express';

import match_model, {
  Match,
  MatchStatus,
  MatchWithTeams,
} from '@/models/matches.js';
import {randomInt} from 'crypto';
import {VlrMatches} from '@/services/matchUpdates.js';
import {
  badRequest,
  HTTP_STATUS,
  internalServerError,
  notAuthenticated,
} from '@/utils/http.js';
import {findTeamId} from './controllers/static_team.js';
import {placeUserMatchBet} from './controllers/matchBetting.js';
import {BadRequestError, UserNotFoundError} from '@/utils/errors.js';
import {requireAuth} from '@/middleware/session.js';
import schedule from 'node-schedule';
import {startUpcomingMatchSchedule} from '@/services/matchUpdates.js';
import config from '@/config/config.js';
import {scheduele_live_check} from '@/services/taskInterface.js';
const router = express.Router();
//needs csrf and authentication for the user session

router.get('/info', getMatchesInfo);
router.post('/bet', requireAuth, postMatchBet);
/**
 * User submited post for making a bet on a match
 * @param req needs match_id, team_winning, wager. in req.body all numbers/ids
 * @param res
 * @returns
 */
async function postMatchBet(
  req: Request<{}, {}, UserMatchBetParams>,
  res: Response
) {
  const {match_id, team_winning, wager} = req.body;

  if (
    match_id === undefined ||
    team_winning === undefined ||
    wager === undefined
  ) {
    console.log(req.body);
    return badRequest(res, 'NOT DEFINED ' + match_id + team_winning + wager);
  }
  if (!req.auth_user) {
    return notAuthenticated(res);
  }
  var uuid = req.auth_user.uuid;

  // if (!uuid) {
  //   return notAuthenticated(res);
  // }

  //thhe request session is getting parsed into json
  //move this to session middleware

  try {
    await placeUserMatchBet(match_id, team_winning, wager, uuid);
  } catch (err) {
    if (err instanceof BadRequestError) {
      return badRequest(res, err.message);
    } else if (err instanceof UserNotFoundError) {
      return notAuthenticated(res);
    } else {
      console.log(err);
      return internalServerError(res);
    }
  }
  res.status(200).json({data: 'ok'});
}
interface UserMatchBetParams {
  match_id?: number;
  team_winning?: number;
  wager?: number;
}

/**
 * Route for getting our betting odds and id values for a potential bet
 * Only gets matches that are in the vlr upcoming or live and both teams are known
 * live matches that ended need to be updated somewhere else
 *
 * @param res
 * @param req
 * @returns
 */
async function getMatchesInfo(req: Request, res: Response) {
  try {
    const response = await fetch(`${config.scraper_url}/api/v1/matches`)
      .then((res1) => res1.json())
      .then((res1) => {
        return res1 as VlrMatches;
      });

    const data_response: MatchWithTeams[] = [];

    for (const match of response.data) {
      let team_a = match.teams[0];
      let team_b = match.teams[1];
      if (team_a.name === 'TBD' || team_b.name === 'TBD') continue; //some of them after still have names
      //find match in database from vlr id

      let existing_matches = await match_model.getMatchWithTeams(
        parseInt(match.id)
      );
      if (existing_matches.length != 0) {
        //test if the status is the same
        if (existing_matches[0].status == MatchStatus.upcoming) {
          //the response matches shouldnt have completed
          //it doesnt hurt to update things here so might as well while i have the request data
          if ((match.status as MatchStatus) == MatchStatus.live) {
            //update the match to live
            existing_matches[0].status = MatchStatus.live;
            await match_model.updateMatchStatus(
              existing_matches[0].id,
              MatchStatus.live
            );
          }
        }

        data_response.push(existing_matches[0]);
      } else {
        if (!match.timestamp) {
          console.log('NO TIMESTAMP');
          continue;
        }
        let a_id = await findTeamId(team_a.name, team_a.country);
        let b_id = await findTeamId(team_b.name, team_b.country);

        if (!a_id || !b_id) {
          console.log(`COULD NOT FIND TEAM ID ${team_a.name}`);
          continue;
        }

        let new_match: Match = {
          id: parseInt(match.id),
          team_a: a_id.id,
          team_b: b_id.id,
          odds: randomInt(-1024, 1024),
          status: match.status as MatchStatus,
          match_start: new Date(match.timestamp * 1000), //this needs to be in miliseconds and i think timestamp is in seconds
        } as Match;
        console.log(`created match ${match.id}, ${match.event}`);
        await match_model.createMatchRow(new_match);
        let te = await match_model.getMatchWithTeams(new_match.id);
        if (te.length == 0) {
          console.log('INSERTION ERROR');
          continue;
        }
        if (te[0].status === MatchStatus.upcoming) {
          let executionTime = new Date(
            new_match.match_start.getTime() + 30000 // plus 30 seconds so its more likely that we dont have to check again
          );
          await scheduele_live_check(new_match.id, executionTime);
        }

        data_response.push(te[0]);
        //find the team ids
        //calculate odds for the team
        //put entry in database
        //add object to return response
      }
    }
    return res.status(200).json({data: data_response});
  } catch (err) {
    console.log(err);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({error: 'ERROR'});
  }
}
export default router;
