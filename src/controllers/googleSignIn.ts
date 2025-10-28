import config, {google_sign_in} from '../config/config.js';
import {Request, Response, NextFunction} from 'express';
import {OAuth2Client, TokenPayload} from 'google-auth-library';
import auth_providers, {
  AuthOptions,
  AuthProvidersStrings,
} from '../models/authProviders.js';
import user_model from '../models/user.js';
import bet_info from '../models/userBetInfo.js';
import {
  UserNotFoundError,
  DatabaseError,
  InvalidPasswordError,
  EmailInUseError,
} from '../errors.js';
import {generateUUIDBuffer, UserOptions} from '../models/user.js';
//this is definitly not the best way to do this but im not sure what is
const GOOGLE_REDIRECT_LINK = `${config.http}://${config.server_addr}/auth/google/callback/`;
const client = new OAuth2Client();

export function check_sign_in_enabled(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!google_sign_in.ENABLED) {
    return res.send('Google Sign in is not configured');
  }
  next();
}
interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: 'Bearer';
  id_token: string;
}
function redirect_google_sign_in(): URLSearchParams {
  const params = new URLSearchParams({
    client_id: google_sign_in.GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_LINK,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });
  return params;
}

async function server_verify_id(code: string): Promise<TokenPayload> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      code,
      client_id: google_sign_in.GOOGLE_CLIENT_ID,
      client_secret: google_sign_in.GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_LINK,
      grant_type: 'authorization_code',
    }),
  });
  var tokens: GoogleTokenResponse;
  try {
    tokens = (await response.json()) as GoogleTokenResponse;
  } catch (err) {
    throw new Error('invalid token');
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: google_sign_in.GOOGLE_CLIENT_ID, // Specify the WEB_CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Could not get payload');
  }

  return payload;
}
//i think linking a new email/password or sign in provider needs to be done in a seperate route
async function getOrCreateGoogleAuthBasedAccount(payload: TokenPayload) {
  //
  let rows = await auth_providers.getAuthByProviderId(
    payload.sub,
    AuthProvidersStrings.Google
  );
  var uuid: Buffer;
  if (rows.length == 0) {
    //make a new auth entry
    //but i need a uuid for an account

    let new_uuid = generateUUIDBuffer();

    uuid = new_uuid;

    if (!payload.email) {
      throw new Error('email is null');
    }
    if (!payload.given_name) {
      throw new Error('name is null');
    }
    //TODO ensure given name is unique
    let user_options: UserOptions = {
      email: payload.email,
      username: payload.given_name,
      display_name: 'TEST NAME',
      avatar: ' NOT IMPLEMENTED',
    };

    await user_model.createUserWithUUID(user_options, uuid);
    let auth_options: AuthOptions = {
      user_id: uuid,
      email: payload.email,
      provider_id: payload.sub,
      provider_name: AuthProvidersStrings.Google,
      hash: null,
      salt: null,
    };
    try {
      await auth_providers.createAuthEntry(auth_options);
      await bet_info.createUserBetInfo(uuid);
      //if this fails i need to get rid of the new user account
      // i think i could juts use a transaction instead
    } catch (err) {
      console.log(err);
      await user_model.removeUserByUUID(uuid);

      throw new DatabaseError('auth entry failed to create');
    }
  } else {
    uuid = rows[0].user_id;
  }
  let rows_user = await user_model.getUserByUuid(uuid);
  if (rows_user.length == 0) {
    throw new UserNotFoundError('GOOGLE SIGN IN FAILED');
  }
  return rows_user[0];
}
export default {
  getOrCreateGoogleAuthBasedAccount,
  redirect_google_sign_in,
  server_verify_id,
};
