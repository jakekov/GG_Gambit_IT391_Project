import express, { Request, Response, NextFunction } from "express";

import match_model, { Match, MatchStatus, MatchWithTeams } from "@/models/matches";
import { randomInt } from "crypto";
import { VlrMatch, VlrMatches } from "./controllers/matchUpdates";
import { HTTP_STATUS } from "@/http";
import { findTeamId } from "./controllers/static_team";
const router = express.Router();

//needs csrf and authentication for the user session

router.get("/info", getMatchesInfo);

async function postMatchBet( req: Request,res: Response) {}

interface CombinedMatches {
    data: Match,
    strings: VlrMatch,
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

  const response = await fetch("http://10.111.21.84:5000/api/v1/matches")
    .then((res1) => res1.json())
    .then((res1) => {
      return res1 as VlrMatches;
    });
  
  const data_response: MatchWithTeams[] = [];

  for (const match of response.data) {
    let team_a = match.teams[0];
    let team_b = match.teams[1];
    if (team_a.name === "TBD" || team_b.name === "TBD") continue; //some of them after still have names
    //find match in database from vlr id
    
    let existing_matches = await match_model.getMatchWithTeams(parseInt(match.id));
    if (existing_matches.length != 0) {
      //test if the status is the same
      if (existing_matches[0].status == MatchStatus.upcoming) {
        //the response matches shouldnt have completed
        if (match.status == MatchStatus.live) {
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
      let a_id = await findTeamId(team_a.name, team_a.country);
      let b_id = await findTeamId(team_b.name, team_b.country);

      if (!a_id || !b_id)  { console.log(`COULD NOT FIND TEAM ID ${team_a.name}`);continue};
      if (!match.timestamp) {
        console.log("NO TIMESTAMP");
        continue;
      }

      let new_match: Match = {
        id: parseInt(match.id),
        team_a: a_id.id,
        team_b: b_id.id,
        odds: randomInt(-1024, 1024),
        status: match.status as MatchStatus,
        match_start: new Date(match.timestamp),
      } as Match;
      console.log(`created match ${match.id}, ${match.event}`);
      await match_model.createMatchRow(new_match);
      let te =await match_model.getMatchWithTeams(new_match.id);
      if (te.length == 0) {
        console.log("INSERTION ERROR");
        continue;
      }

      data_response.push(te[0]);
      //find the team ids
      //calculate odds for the team
      //put entry in database
      //add object to return response
    }
  }
    return res.status(200).json({ data: data_response });
} catch (err) {
    console.log(err)
    return res.status(HTTP_STATUS.SERVER_ERROR).json({data: "ERROR"});
}
}
export default router;