import matchModel, {MatchStatus} from '@/models/matches.js';
import teamModel from '@/models/staticTeams.js';
import betInfoModel from '@/models/userBetInfo.js';
import betModel, {MatchBetOptions} from '@/models/match_bet.js';
import {BadRequestError, UserNotFoundError} from '@/utils/errors.js';
/**
 * Makes sure a match is valid
 * @param match_id vlr and our primary key for a match
 * @param team_id vlr and our static mapping of team ids
 * @returns "a" or "b" to indicate which team the team id cooresponds to
 */
export async function validateMatchBet(
  match_id: number,
  team_id: number
): Promise<[string, number]> {
  //the match needs to be made in our database
  const match = await matchModel.getMatchById(match_id);
  if (match.length == 0) {
    throw new BadRequestError('Match not found');
  }
  if (
    match[0].match_start.getTime() <= Date.now() ||
    match[0].status !== MatchStatus.upcoming
  ) {
    throw new BadRequestError('Match has or is already supposed to start');
  }
  const team = await teamModel.getTeamById(team_id);
  if (team.length == 0) {
    throw new BadRequestError('Team not found');
  }

  if (team_id === match[0].team_a) {
    return ['a', match[0].odds];
  } else if (team_id === match[0].team_b) {
    return ['b', match[0].odds];
  }
  throw new BadRequestError('Team does not play in match');
}
async function removeUserBalance(remove: number, uuid: Buffer) {
  if (remove < 0) {
    console.log('tried to remove balance negative value');

    throw new BadRequestError('Invalid value');
  }
  //this needs to be a transaction and do a rowlock read of the info
  const info = await betInfoModel.getInfoByUuid(uuid);
  if (info.length == 0) {
    throw new UserNotFoundError();
  }
  const user_balance = info[0].balance;
  if (user_balance - remove < 0) {
    throw new BadRequestError(
      `Insuficcient funds: Available: ${user_balance}, request: ${remove} `
    );
  }
  betInfoModel.removebalance(remove, info[0].id);
}
/**
 * @throws BadRequestError(info), UserNotFoundError
 * @param match_id
 * @param team_id
 * @param wager
 * @param uuid
 */
export async function placeUserMatchBet(
  match_id: number,
  team_id: number,
  wager: number,
  uuid: Buffer
) {
  //if i want to prevent duplicate responses
  //i could use teh csrd token and then resend it with the response
  //so the client needs to wait for backend to process their csrf needing request before submitting another
  if (wager <= 0) {
    throw new BadRequestError('Need to wager more than 0');
  }
  const [a_or_b, odds] = await validateMatchBet(match_id, team_id);
  //this needs to be a transaction so an error later doesnt cause the use rto lose balance
  await removeUserBalance(wager, uuid);
  //odds is -1024 a to win 1024 b to win
  const percent = Math.max(Math.min(odds, 1024), -1024) / 1026;
  //convert to 0-1
  const shift = percent * 0.5 + 0.5;
  var multiplier = 1;
  if (a_or_b === 'a') {
    //since percent cant be greater than 1 its fine to juts multiply by negative one since shift will always be less then 1 and greater than zero

    multiplier = -1 / (shift - 1); //a is negative so closer to 0 we want it to be less
  } else if (a_or_b === 'b') {
    //b is positive so closer to 1 we want it to be less
    multiplier = 1 / shift;
  } else {
    throw new Error('NO A OR B');
  }
  if (multiplier < 0)
    throw new Error(`Multipler is negative ${multiplier}, ${odds}`);
  const payout = wager * multiplier; //wager is always atleast self + winnings becasuse percent is 0-1 so dividing by it will always be 1.
  const options: MatchBetOptions = {
    user_id: uuid,
    match_id: match_id,
    prediction: a_or_b,
    bet: wager,
    payout: payout,
  };
  await betModel.createUserBet(options);
}
