import AuthCredentials, { AuthProvider, AuthProvidersStrings, AuthOptions } from "../models/authProviders";
import unverifiedUser from "../models/unverifiedUser";
import { NextFunction, Request, Response } from "express";
import { scrypt as _scrypt, randomBytes } from "crypto";
import user_model, {generateUUIDBuffer, User, UserOptions} from "../models/user";
import crypto from "crypto";
import { promisify } from "util";
import config from "../config/config";
import { stringify as uuidStringify } from "uuid";
import {
  UserNotFoundError,
  DatabaseError,
  InvalidPasswordError,
  EmailInUseError,
} from "../errors";

const scrypt = promisify(_scrypt);
/**
 * Checks if the input credentials are in the database and are correct
 * @param account_name email or username
 * @param password plaintext password
 */
async function checkUserCredentials(
  account_name: string,
  password: string,
): Promise<AuthProvider> {
  //could be a username or email for logging in could also do this in frontent and make a second checkuser
  let contains_at = account_name.includes("@");
  if (!contains_at) {
    throw new Error("email not valid");
  }
  let user_auth;
  try {
    user_auth = await AuthCredentials.getAuthByEmail(account_name, AuthProvidersStrings.LocalAuth);
  } catch (err) {
    console.error(err);
    throw new DatabaseError("Database error");
  }

  if (user_auth.length == 0) {
    const val = contains_at ? "email" : "username";
    //i should remove this
    throw new UserNotFoundError("Username or passward is incorrect");
  }
  let salt =user_auth[0].salt;
  let hash =user_auth[0].hash;
  if (!salt || !hash) {
    throw new DatabaseError("LocalAuth is null");
  }
  const derivedKey = (
    (await scrypt(password, salt, 64)) as Buffer
  ).toString("base64");
  //doesnt need to be time safe
  if (derivedKey !== hash)
    throw new InvalidPasswordError("Username or passward is incorrect");
  //now get the user information from the other table
  return user_auth[0];
}
/**
 *
 * Creates a localAuth entry for a user id
 * if the localAuthEntry exists already 
 * this relies on a user account already being made so it should be fine to just check if the localAuth exists
 * @returns email verification token | undefined
 */
async function createLocalAuth(
  email: string,
  password: string,
  id: Buffer, // the user tables uuid
) {
  let user_auth;
  try {
    user_auth = await AuthCredentials.getAuthByEmail(email, AuthProvidersStrings.LocalAuth);
    
  } catch (err) {
    console.error(err);
    throw new DatabaseError("Database error");
  }
  //and im not sure how good it would be to prompt a username after signing up

  // if (unverified.length != 0) {
  //   let date = new Date(unverified[0].created);
  //   //if the verify request creation time + timeout exceeds date now the email is still waiting to be verified
  //   if (Date.now() < date.getTime() + config.verification_timeout) {
  //     throw new EmailInUseError("Email is waiting for verification");
  //   }
  //   await unverifiedUser.removeUser(unverified[0].token);
  //   console.log("removed expired entry");
  // }
  //check the email in user after the time check for verify
  //I think this somewhat prevents users very slim chance that user clicks verification and register at the same time
  //because register would have to expire right as the verification accepted and removed the row
  if (user_auth.length != 0) {
    throw new EmailInUseError("Email is already in use");
  }
  let salt = randomBytes(16).toString("base64");
  const derivedKey = ((await scrypt(password, salt, 64)) as Buffer).toString(
    "base64",
  );
  let string_uuid = uuidStringify(id);
  let auth_options: AuthOptions= {
    user_id: id,
    email: email,
    provider_name: AuthProvidersStrings.LocalAuth,
    provider_id: string_uuid, //i think this being the id is okay
    hash: derivedKey,
    salt: salt,
  } 
  //it might be bettwe to use JWT but i dont really see a point
  //ive got to save the unverified data somewhere anyway unless i include hash salt email in the jwt but i think that would be in plain text
  //handle email verification in login of unverified user
  
  try {
    await AuthCredentials.createAuthEntry(auth_options)
  } catch (err) {
    console.log(err);
    throw new DatabaseError(" Database Error");
  }
  // let token = randomBytes(16).toString("base64url");
  // try {
  //   await unverifiedUser.createUser(derivedKey, email, token, salt);
  // } catch (err) {
  //   console.error(err);
  //   throw new DatabaseError("Database error");
  // }
  // return token;
}
async function verifyAccount(auth: AuthProvider): Promise<User> {
  
  let rows = await user_model.getUserByUuid(auth.user_id)
  if (rows.length == 0) {
    throw new UserNotFoundError;
  }

  let acc = rows[0];
  if (config.email_verification === true) {
    //the google sign in doesnt need email verification
    if (auth.provider_name == AuthProvidersStrings.LocalAuth) {
      if (acc.email_verified === false) {
      console.log("implement something here user not verified");
      throw new UserNotFoundError;
    }
    }
    
  } else {
    console.log("logged in without verified email");
  }
  
  return acc;
}
async function LocalAuthOrNewAccount(email: string, password: string) {
  
      //need to create an account if none exists using the password
      //createLocalAuth checks if localAuth already exists
      //but i need to remove the account if localAuth fails
      //i dont want it linking to an existing account on signup it needs to only be able to make a new one
      let existing_account = await user_model.getUserByEmail(email);
      let existing_local_auth  = await AuthCredentials.getAuthByEmail(email, AuthProvidersStrings.LocalAuth);
      if (existing_account.length != 0 || existing_local_auth.length != 0) {
        throw new EmailInUseError("email used in existing account");
      }
      var uuid;
          //create new user
          //can i just select UUID(); in sql and have it return a uuid for me to use
          try {
            let new_uuid = generateUUIDBuffer();
            
            let user_options: UserOptions = {
      email: email,
      username: "test" + randomBytes(3).toString(), //todo needs to actually check the databse before 
      display_name: null,
      avatar: null,
    }
      await user_model.createUserWithUUID(user_options, new_uuid);
    
            uuid = new_uuid;
          } catch (err) {
            console.log(err);
            throw new DatabaseError("could not create uuid account");
          }
      
      try {
        await createLocalAuth(email, password, uuid);
      } catch (err) {
        console.log(err)
        //Need to remove the created account because there is no auth provider for it
        await user_model.removeUserByUUID(uuid);
                        
                        throw new DatabaseError("auth entry failed to create");
      }
      
    
    //the lis created if it didnt exist
    //the account may or may not exist
    //but we have the uuid for an account
    
    console.log("localAuth Created");
    
}

export default { checkUserCredentials, LocalAuthOrNewAccount, verifyAccount };
