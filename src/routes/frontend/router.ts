import express, {Request, Response, NextFunction} from 'express';

import config from '@/config/config.js';
import path from 'path';

import {_rootDir} from '@/utils/esm_paths.js';
const staticPath = path.join(_rootDir, '../static');
const EMAIL_LINK = `${config.http}://${config.server_addr}/email/verification/verify-email/`;
const router = express.Router();

router.get('/signup', (req: Request, res: Response) => {
  if (req.session.user != null) {
    //user is already logged in go to default ie dashboard account home whatever it is
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(staticPath, 'signup.html'));
});
router.get('/login', (req: Request, res: Response) => {
  if (req.session.user != null) {
    //user is already logged in go to default ie dashboard account home whatever it is
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(staticPath, 'login.html'));
});
//make logon route for nav bar (copy format) and update navbar routes on all pages!!!
//change href to /signup or like the name
// needs to be updated on frontendpoints be sure to this first!!!
router.get('/dashboard', (req: Request, res: Response) => {
  if (req.session.user == null) {
    //user is not logged in go to default ie dashboard account home whatever it is
    return res.redirect('/home');
  }
  res.sendFile(path.join(staticPath, 'dashboard.html'));
});
router.get('/homelogon', (req: Request, res: Response) => {
  if (req.session.user == null) {
    //user is not logged in go to default ie dashboard account home whatever it is
    return res.redirect('/home');
  }
  res.sendFile(path.join(staticPath, 'homelogon.html'));
});
router.get('/account', (req: Request, res: Response) => {
  if (req.session.user == null) {
    //user is not logged in go to default ie dashboard account home whatever it is
    return res.redirect('/home');
  }
  res.sendFile(path.join(staticPath, 'account.html'));
});
router.get('/home', (req: Request, res: Response) => {
  if (req.session.user != null) {
    //user is not logged in go to default ie dashboard account home whatever it is
    return res.redirect('/homelogon');
  }
  res.sendFile(path.join(staticPath, 'home.html'));
});
export default router;
