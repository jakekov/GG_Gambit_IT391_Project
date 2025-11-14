import config, {google_sign_in} from '@/config/config.js';
import {AuthProvidersStrings} from '@/models/authProviders.js';
import {EmailInUseError} from '@/utils/errors.js';
import {OAuth2Client, TokenPayload} from 'google-auth-library';
import AuthModel from '@/models/authProviders.js';
import {OAuthProfile} from '../helpers/index.js';
const client = new OAuth2Client();
const GOOGLE_REDIRECT_LINK = `${config.http}://${config.server_addr}/api/auth/callback/google/`;
interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: 'Bearer';
  id_token: string;
}
/**
 * Creates the google sign in parameters for google oauth
 */
export function redirect_google_sign_in(state: string): URLSearchParams {
  const params = new URLSearchParams({
    client_id: google_sign_in.GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_LINK,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: state,
  });
  return params;
}
/**
 * Takes a code from the google callback url and verifies it with googleOauth
 * @param code returned code from the google callback
 * the code is used to get user profile data from google
 * @returns Oauth profile data to create an account or retrieve existing account
 */
export async function get_google_profile(code: string): Promise<OAuthProfile> {
  var payload;

  payload = await server_verify_google_id(code);

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
  let email_in_user = await AuthModel.getAnyAuthByEmail(payload.email);
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
    throw new EmailInUseError(
      'Email is in use by an account Please link your accounts in Account settings'
    );
  }
  if (!payload.email) {
    throw new Error('email is null');
  }
  if (!payload.given_name) {
    throw new Error('name is null');
  }
  let profile = {
    email: payload.email,
    provider_name: AuthProvidersStrings.Google,
    provider_id: payload.sub,
    username: payload.given_name,
    display_name: payload.given_name,
    avatar_url: payload.picture || null,
  } satisfies OAuthProfile;
  return profile;
}
/**
 * google specific code verification via googles node oauth package
 * @param code
 * @returns
 */
async function server_verify_google_id(code: string): Promise<TokenPayload> {
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
    console.log(err);
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
