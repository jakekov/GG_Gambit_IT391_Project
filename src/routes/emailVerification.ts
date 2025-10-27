//this route should be protected with middleware that checks the token and jwt verifies it

import email_verify from '../controllers/emailController.js';

import express, {Request, Response, NextFunction} from 'express';
import {sendMail} from '../nodemailer/mailing.js';

const router = express.Router();
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.send('hello response');
});
router.get('/testemail', async (req: Request, res: Response) => {
  const from: string = 'Gg.gambit.noreply@gmail.com';
  const to: string = 'shfloopyuh@gmail.com';
  const subject: string = 'TEST';
  const mailTemplate: string =
    '<html string either defined, or loaded from a html file>';
  try {
    await sendMail(from, to, subject, mailTemplate);
  } catch (err) {
    console.log('error sending verification email' + err);
    return res.status(500).json({error: 'Internal server error'});
  }
  res.send('Sent email');
});
//you knwo what a much better idea is
//make a table with the id to verified status cause you only need to check it on login / register
//or maybe just do it with username so users doesnt have a null value
//
/**
 * Get route for email verfication link
 * Email is sent with the token at the end of the link
 * this will take a user from unverfied table to verified
 */
router.get(
  '/verify-email/:token',
  async (req: Request<{token?: string}>, res: Response) => {
    //store tokens as hashses
    console.log('token link clicked');
    let users;
    let token = req.params.token;
    if (!token) {
      return res.send(400).json({error: 'Malformed Request'});
    }
    try {
      let status = await email_verify.verifyEmailVerificationToken(token);
      if (!status) {
        return res.send('invalid token');
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({error: 'Database Error'});
    }

    console.log('verification success');
    res.send('Account verified');
    //try to send the browser waiting on verification into login or log them in automatically
  }
);
//the route that thte user clicks in the email
router.get('/password/reset/:email', passwordReset);
async function passwordReset(req: Request<{email?: string}>, res: Response) {
  let email = req.params.email;

  console.log('password reset ' + email);
  if (!email) {
    return res.status(400).json('malformed request'); // i think this needs to send a site back instead
  }
  //dont verify the token here
}
async function passwordResetForm() {}
export default router;
