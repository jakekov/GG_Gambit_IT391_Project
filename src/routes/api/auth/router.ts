import express, {Request, Response, NextFunction} from 'express';
import {stringify as uuidStringify} from 'uuid';
import {badRequest, internalServerError} from '@/utils/http.js';
import {
  check_sign_in_enabled,
  get_or_create_oauth_account,
  oath_callback_profile,
  oauth_redirect_links,
} from './helpers/index.js';
import crypto from 'crypto';
import {AuthProvider} from '@/models/authProviders.js';
import UserController from './controllers/userController.js';
import {
  DatabaseError,
  EmailInUseError,
  InvalidPasswordError,
  UserNotFoundError,
} from '@/utils/errors.js';
import {User} from '@/models/user.js';
import config from '@/config/config.js';
import emailController from '@/controllers/emailController.js';
import {EmailConformationString} from '@/models/email_tokens.js';
import {sendMail} from '@/utils/mailing.js';
const router = express.Router();
/**
 * Makes sure the server can handle sending oauth links
 * this probably needs to change because it requires the serve to have all oauth providers set up
 */

router.get('/redirect/:provider', check_sign_in_enabled, oauth_redirect);
/**
 * When the user is done authenticating with the Oauth provider it sends the browser to this route
 * this route takes the provider and creates a profile from the helper for each auth provider
 * it then logs in the user to the existing account or creates a new account
 */
router.get('/callback/:provider/', check_sign_in_enabled, oauth_callback);
router.post('/login', auth_login);
router.post('/signup', auth_signup);
router.get('/logout', auth_logout);
router.post('/password/reset', postPasswordReset);
/**
 * redirects the request to the providers oauth url
 * sets up a session in order to use the oauth state for csrf prevention
 * @param req needs AuthProvider Type in url
 * @param res
 * @returns
 */
async function oauth_redirect(
  req: Request<{provider?: string}>,
  res: Response
) {
  const provider = req.params.provider;
  if (!provider) return badRequest(res);
  let state = crypto.randomBytes(32).toString('hex');
  console.log(state);
  req.session.state = state;
  //include a state query param which oauth forwards with the callback url to prevent csrf
  let url = oauth_redirect_links(provider, state);
  console.log(req.session.state);
  res.redirect(url);
}

interface OauthCallbackQuery {
  code?: string;
  state?: string;
}

/**
 * Takes in prividers callback information and authenticates the oauth
 * creates an account if its a new oauth sign in
 * @param req needs AuthProvider type and the correct callback query info
 * @param res
 * @returns Error if email is already in use by a different login method
 */
async function oauth_callback(
  req: Request<{provider?: string}, {}, {}, OauthCallbackQuery>,
  res: Response
) {
  const provider = req.params.provider;

  if (!provider) return badRequest(res);
  const code = req.query.code;
  const state = req.query.state;

  if (!state) {
    return res.status(403).json({error: 'csrf state not defined'});
  }
  //do state check to make sure the same session is making the callback
  if (state !== req.session.state) {
    console.log(req.session.state + ' ' + state);
    console.log('possible csrf attack OAuth states do not match');
    return res.end('State mismatch. Possible CSRF attack');
  }

  if (!code) {
    return res.status(403).json({error: 'code not defined'});
  }
  var profile;
  try {
    profile = await oath_callback_profile(provider, code);
  } catch (err) {
    console.log(err);
    return res.status(403).json({error: 'unable to verify google account'});
  }
  let user = await get_or_create_oauth_account(profile);

  console.log(`logged in Oauth ${provider} ${profile.email}`);
  req.session.user = {
    id: uuidStringify(user.id),
    username: user.username,
    id_buf: user.id,
  }; //create the auth session info
  res.redirect('/dashboard');
}

interface LoginForm {
  email: string;
  password: string;
}
/**
 * Function that logs in a LocalAuth User and creates a session
 * @param req Login form
 * @param res
 * @returns
 */
async function auth_login(req: Request<{}, {}, LoginForm>, res: Response) {
  //TODO check the verifification / resend
  //if the email fails to send the email wont be usable for expiration time
  if (!req.body) {
    return badRequest(res, 'Body is undefined');
  }
  const {email, password} = req.body;
  if (!email || !password) {
    return badRequest(res);
  }

  const account_name = email;
  let acc: AuthProvider | undefined;
  try {
    acc = await UserController.checkUserCredentials(account_name, password);
  } catch (err) {
    if (
      err instanceof UserNotFoundError ||
      err instanceof InvalidPasswordError
    ) {
      // Expected auth errors → send 401
      return res.status(401).json({error: err.message});
    } else if (err instanceof DatabaseError) {
      return res.status(500).json({error: err.message});
    }
    console.log('unexpected error ');
    console.log(err);
    return res.status(500).json({error: 'Internal server error'});
  }
  let profile: User;
  try {
    profile = await UserController.verifyAccount(acc);
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(401).json({error: err.message});
    } else if (err instanceof DatabaseError) {
      console.log(err);
      return res.status(500).json({error: err.message});
    }
    console.log('unexpected error ');
    console.log(err);
    return res.status(500).json({error: 'Internal server error'});
  }

  console.log(`logged in ${profile.email}`);
  req.session.user = {
    id: uuidStringify(profile.id),
    username: profile.username,
    id_buf: profile.id,
  }; //create the auth session info
  res.cookie('isAuthenticated', 'true', {sameSite: 'lax'});
  res.status(200).json({
    email: profile.email,
    username: profile.username,
  });
}
interface SignupForm {
  username: string;
  email: string;
  password: string;
}
const EMAIL_LINK = `${config.http}://${config.server_addr}/email/verification/verify-email/`;

/**
 * Singup Post Route
 * takes an email and password
 * checks if the email is already in use then takes token and sends an email with the otken in the link
 *
 * @param req needs signup form
 * @param res
 * @returns
 */
async function auth_signup(req: Request<{}, {}, SignupForm>, res: Response) {
  const {username, email, password} = req.body;
  try {
    //need to create an account if none exists using the password
    //createLocalAuth checks if localAuth already exists
    //but i need to remove the account if localAuth fails
    if (!email || !password || !username) return badRequest(res);

    await UserController.LocalAuthOrNewAccount(username, email, password);
  } catch (err) {
    if (err instanceof EmailInUseError) {
      // Expected auth errors → send 401
      return res.status(401).json({error: err.message});
    } else if (err instanceof DatabaseError) {
      return res.status(500).json({error: err.message});
    }
    console.log('unexpected error ');
    console.log(err);
    return res.status(500).json({error: 'Internal server error'});
  }
  if (config.email_verification === true) {
    //update the email_verified for the account
    var token = null;
    try {
      token = await emailController.generateEmailVerificationToken(
        email,
        EmailConformationString.verify_account
      );
    } catch (err) {
      console.log('email verification failed but account created');
      return res.status(500).json({error: 'Internal server error'});
    }
    if (!token) {
      console.log('token is null but account is created');
      return res.status(500).json({error: 'Internal server error'});
    }
    const from: string = '<from email ID>';
    const to: string = email;
    const subject: string = '<subject>';
    const mailTemplate: string = EMAIL_LINK + token; //TODO change this back from 3000 when config changes
    try {
      await sendMail(from, to, subject, mailTemplate);
    } catch (err) {
      console.log('error sending verification email' + err);
      //then send another response if it goes bad
      return res.status(500).json({error: 'Internal server error'});
    }
    console.log('sent email to ', email);
    return res.status(200).json({
      data: 'Signup Success email verification required',
      url: '/email/verification/waiting',
    });
  }
  res.status(200).json({data: 'Signup Success'}); //just send the response early before checking
  //send to whatever page is after signup needs to be a site waiting for the email authentication
  //so i guess do nothing for right now
}

function auth_logout(req: Request, res: Response) {
  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error logging out');
    } else {
      res.clearCookie('isAuthenticated');
      res.redirect('/');
    }
  });
}

async function postPasswordReset(
  req: Request<{}, {}, {email?: string}>,
  res: Response
) {
  let email = req.body.email;
  if (!email) return badRequest(res);
  try {
    UserController.passwordResetEmail(email);
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(200).json({
        data: 'If a user exists for the account a password reset email was sent',
      });
    }
    console.log(err);
    internalServerError(res);
  }
  return res.status(200).json({
    data: 'If a user exists for the account a password reset email was sent',
  });
}
export default router;
