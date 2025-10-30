import express, {Request, Response, NextFunction} from 'express';

import {
  DatabaseError,
  EmailInUseError,
  InvalidPasswordError,
  UserNotFoundError,
} from '../utils/errors.js';
import Verified, {AuthProvidersStrings} from '../models/authProviders.js';

import google_controller, {
  check_sign_in_enabled,
} from '../controllers/googleSignIn.js';
import {stringify as uuidStringify} from 'uuid';
import {generateUUIDBuffer} from '../models/user.js';

const router = express.Router();

router.use(express.urlencoded({extended: true}));
router.use('/', check_sign_in_enabled);
router.get('/uuid', async (req: Request<{}, {}, {}>, res: Response) => {
  console.log('uuid test');
  console.log(generateUUIDBuffer());
});
router.get(
  '/google/redirect/',
  async (req: Request<{}, {}, {}>, res: Response) => {
    let search_params = google_controller.redirect_google_sign_in();
    //console.log(`search params: ${search_params}`);
    //const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    //url.search = search_params.toString();
    res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${search_params}`
    );
    //console.log(url.toString());
    //res.redirect(url.toString());
  }
);
router.get(
  '/google/callback/',
  async (req: Request<{}, {}, {}>, res: Response) => {
    let code = req.query.code as string | undefined;
    if (!code) {
      return res.status(403).json({error: 'code not defined'});
    }
    var payload;
    try {
      payload = await google_controller.server_verify_id(code);
    } catch (err) {
      console.log(err);
      return res.status(403).json({error: 'unable to verify google account'});
    }

    // This ID is unique to each Google Account, making it suitable for use as a primary key
    // during account lookup. Email is not a good choice because it can be changed by the user.
    const user_id = payload['sub'];
    // If the request specified a Google Workspace domain:
    // const domain = payload['hd'];
    console.log(user_id);
    //lookup in database
    //if exists get that account
    //if not create new account
    //create session with userid
    //
    //if auth already exists sign into the account associated with the authProvider
    //if the authprovider does not exist  and account doesnt exist create account and authProvider with new uuid
    //what if i want to post link google account
    //add a query param to callback with the uuid and jwt the uuid but have it be stateless and add expiry time to it
    //
    //if the email is in use in another authProvider this needs to fail because you need to link accounts then
    if (!payload.email) {
      throw new Error('email is null');
    }
    let email_in_user = await Verified.getAnyAuthByEmail(payload.email);
    var email_in_use = false;
    if (email_in_user.length != 0) {
      for (const row of email_in_user) {
        email_in_use = row.provider_name !== AuthProvidersStrings.Google;
        if (email_in_use) {
          break;
        }
      }
    }
    if (email_in_use) {
      return res.send(
        'Email is in use by an account Please link your accounts in Account settings'
      );
    }
    let profile =
      await google_controller.getOrCreateGoogleAuthBasedAccount(payload);
    //use session helper to create account
    console.log(`logged in Google ${profile.email}`);
    req.session.user = {
      id: uuidStringify(profile.id),
      username: profile.username,
      id_buf: profile.id,
    }; //create the auth session info
    res.redirect('/dashboard');
  }
);

export default router;
