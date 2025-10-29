import match_model, {Match} from '@/models/matches.js';
import results_model, {ResultOptions} from '@/models/match_results.js';
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

async function matchEnded(id: number) {
  //needs to check results for the info
  const response = await fetch('http://10.111.21.84:5000/api/v1/matches')
    .then((res) => res.json())
    .then((res) => {
      return res as VlrMatches;
    });
}
/**
 * Checks if any current live matches exists if not it means its ended
 * Queries vlr results to get end info and moves the match from matches to results table
 * Emits an event with the match id so a system can update bets
 * @param live_matches Matches in matches table that have MachStatus Live
 * @param matches All vlr_match ids returned from api/v1/matches
 * @returns
 */

async function checkConclusions(live_matches: Match[], matches: number[]) {
  //for each live match check if it exists in number
  //number is only like 40 long so just do array although in javascript im not sure how well that would translate
  const ended_matches: Match[] = [];
  for (const match of live_matches) {
    if (matches.includes(match.id)) continue;
    //the match has ended and should be in results
    ended_matches.push(match);
  }
  if (ended_matches.length == 0) return;
  const response = await fetch('http://10.111.21.84:5000/api/v1/results')
    .then((res) => res.json())
    .then((res) => {
      return res as VlrMatches;
    });

  for (const match of ended_matches) {
    for (const vlr_result of response.data) {
      if (parseInt(vlr_result.id) !== match.id) continue;
      //found a match in results
      //remove the entry from the matches and put it into results with updated info
      let a = vlr_result.teams[0].score;
      let b = vlr_result.teams[1].score;
      if (a === null || b === null) {
        console.log('return result equals');
        console.log(match);
        console.log(vlr_result);
        continue;
      }
      await match_model.removeMatch(match.id);

      let options: ResultOptions = {
        score_a: parseInt(a),
        score_b: parseInt(b),
        event: vlr_result.event,
        tournament: vlr_result.tournament,
        img: vlr_result.img,
      };
      await results_model.createResultRow(match, options);
      //todo emit an event for updating peoples bets
      break;
    }
  }
}
