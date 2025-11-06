//what routes to get
//this is going to be /api/user
// / will get teh sessions user
// /:slug will get the user with that id | username (clicking on the profile of someone on the leaderboard)
// /leaderboard //get list of users ?limit ?page //returns list of profiles with leaderboard info
// the points or whatever is going to be a seperate table so updates are quicker
//index by uuid

import express, {Request, Response, NextFunction} from 'express';
import {getUserProfileData, updateUserProfile} from './controllers/profile.js';
import bet_info from '@/models/userBetInfo.js';
import user_model, {User} from '@/models/user.js';
import {HTTP_STATUS} from '@/utils/http.js';
import BetInfo from '@/models/userBetInfo.js';
import {requireAuth} from '@/middleware/session.js';
const router = express.Router();

router.get('/', getUser);
router.get('/get/:slug', getUser);
router.get('/leaderboard', getLeaderboard);
router.get('/balance', requireAuth, getUserBalance); //only session user can get
router.patch('/', requireAuth, patchUser);
async function getUser(
  req: Request<{slug: string | undefined}>,
  res: Response
) {
  try {
    const id = req.params.slug || req.session.user?.id;
    if (!id) return res.status(400).json({error: 'Bad request'});

    const user = await getUserProfileData(id);
    return res.status(user.status).json(user.data);
  } catch (err) {
    console.log(err);
    return res.status(500).json({error: 'Internal server error'});
  }
}
function clamp(val: number, min: number, max: number) {
  return val <= min ? min : val >= max ? max : val;
}
interface UserLeaderBoardStats {
  username: string;
  display_name: string | null;
  avatar: string | null;
  points: number;
}
async function getLeaderboard(req: Request, res: Response) {
  let limit = clamp(parseInt(req.query.limit as string) || 10, 1, 50);
  let page = Math.max(parseInt(req.query.page as string) || 0, 0);
  try {
    let info = await bet_info.getLeaderboard(limit);
    const user_list: UserLeaderBoardStats[] = [];
    for (let i = 0; i < info.length; i++) {
      let value = info[i];
      let users = await user_model.getUserByUuid(value.user_id);
      if (users.length == 0) continue;
      let user = users[0];
      let stat: UserLeaderBoardStats = {
        username: user.username,
        display_name: user.display_name,
        avatar: user.avatar,
        points: value.points,
      };
      user_list.push(stat);
    }
    return res
      .status(200)
      .json({data: {user_list: user_list, page: 'not implemented'}});
  } catch (err) {
    console.log(err);
    return res.status(500).json({error: 'Internal server error'});
  }
}
export interface PatchUserForm {
  username: string;
  display_name: string;
  avatar: string;
}
//add express.json and urlencoded extended true to app.use
async function patchUser(req: Request<{}, {}, PatchUserForm>, res: Response) {
  const user_form = req.body;
  let user_id = req.auth_user?.uuid;
  if (!user_id)
    return res
      .status(HTTP_STATUS.UNAUTHENTICATED)
      .json({error: 'Not authenticated'});

  try {
    let data = await updateUserProfile(user_form, user_id);
    return res.status(data.status).json(data.data);
  } catch (err) {
    console.log(err);
    return res.status(500).json({error: 'Internal server error'});
  }
}
async function getUserBalance(req: Request, res: Response) {
  let user_id = req.auth_user?.uuid;
  if (!user_id)
    return res
      .status(HTTP_STATUS.UNAUTHENTICATED)
      .json({error: 'Not authenticated'});
  try {
    const info = await BetInfo.getInfoByUuid(user_id);
    if (info.length == 0)
      return res.status(500).json({error: 'Info does not exist'});
    const data = {
      points: info[0].points,
      balance: info[0].balance,
    };
    return res.status(HTTP_STATUS.OK).json(data);
  } catch (err) {
    console.log(err);
    return res.status(500).json({error: 'Internal server error'});
  }
}
async function addUserBalance(req: Request, res: Response) {
  let user_id = req.session.user?.id_buf;
  if (!user_id)
    return res
      .status(HTTP_STATUS.UNAUTHENTICATED)
      .json({error: 'Not authenticated'});

  try {
    const info = await BetInfo.getInfoByUuid(user_id);
    if (info.length == 0)
      return res.status(500).json({error: 'Info does not exist'});
    const data = {
      points: info[0].points,
      balance: info[0].balance,
    };
    return res.status(HTTP_STATUS.OK).json(data);
  } catch (err) {
    console.log(err);
    return res.status(500).json({error: 'Internal server error'});
  }
}
export default router;
