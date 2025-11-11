import config, {google_sign_in} from '@/config/config.js';
import AuthModel, {
  AuthOptions,
  AuthProvidersStrings,
} from '@/models/authProviders.js';
import UserModel, {generateUUIDBuffer, UserOptions} from '@/models/user.js';
import BetInfoModel from '@/models/userBetInfo.js';
import {DatabaseError, UserNotFoundError} from '@/utils/errors.js';
import {Request, Response, NextFunction} from 'express';
import {randomInt} from 'crypto';
import {
  get_google_profile,
  redirect_google_sign_in,
} from '../providers/google.js';

//put stuff like urls here
export interface OAuthProfile {
  email: string;
  provider_name: AuthProvidersStrings;
  provider_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}
/**
 * Oauth links for each provider the server supports
 */
export function oauth_redirect_links(provider: string, state: string): string {
  switch (provider.toLowerCase()) {
    //TODO should make the enum lowercase but would require db updates
    case AuthProvidersStrings.Google.toLowerCase(): {
      return `https://accounts.google.com/o/oauth2/v2/auth?${redirect_google_sign_in(state)}`;
    }
    default:
      throw new Error('invalid oAuth type');
  }
}
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
/**
 *
 * @param provider slug in the url unique to each provider ie /google/ /discord/
 * @param code /code returned from the oauth callback which the server uses to get profile data
 * @returns
 */
export async function oath_callback_profile(provider: string, code: string) {
  switch (provider.toLowerCase()) {
    case AuthProvidersStrings.Google.toLowerCase():
      return await get_google_profile(code);
    default:
      throw new Error('invalid provider');
  }
}
/**
 * creates the oauth based account
 * @param profile
 * @returns
 */
export async function get_or_create_oauth_account(profile: OAuthProfile) {
  //
  const rows = await AuthModel.getAuthByProviderId(
    profile.provider_id,
    profile.provider_name
  );
  var uuid: Buffer;
  if (rows.length == 0) {
    //make a new auth entry
    //but i need a uuid for an account

    const new_uuid = generateUUIDBuffer();

    uuid = new_uuid;

    //check if username is unique if not try adding random numbers

    const user_name_taken = await UserModel.getUserByUsername(profile.username);

    const username =
      user_name_taken.length !== 0
        ? profile.username + randomInt(1024).toString() //username is taken add some random numbers to it
        : profile.username;

    const user_options: UserOptions = {
      email: profile.email,
      username: username,
      display_name: profile.display_name,
      avatar: profile.avatar_url,
    };

    await UserModel.createUserWithUUID(user_options, uuid);
    const auth_options: AuthOptions = {
      user_id: uuid,
      email: profile.email,
      provider_id: profile.provider_id,
      provider_name: profile.provider_name,
      hash: null,
      salt: null,
    };
    try {
      await AuthModel.createAuthEntry(auth_options);
      await BetInfoModel.createUserBetInfo(uuid);
      //if this fails i need to get rid of the new user account
      // i think i could juts use a transaction instead
    } catch (err) {
      console.log(err);
      await UserModel.removeUserByUUID(uuid); //this gets rid of auth entry but not bet info

      throw new DatabaseError(`auth entry failed to create ${profile}`);
    }
  } else {
    uuid = rows[0].user_id;
  }
  const rows_user = await UserModel.getUserByUuid(uuid);
  if (rows_user.length == 0) {
    throw new UserNotFoundError(`OAuth SIGN IN FAILED ${profile}`);
  }
  return rows_user[0];
}
