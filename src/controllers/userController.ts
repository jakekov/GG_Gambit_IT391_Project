import User, { AuthUser } from "../models/userModels";
import unverifiedUser from "../models/unverifiedUser";
import { NextFunction, Request, Response } from "express";
import { scrypt as _scrypt, randomBytes } from "crypto";
import crypto from "crypto";
import { promisify } from "util";
import config from "../config/config";
import {
  UserNotFoundError,
  DatabaseError,
  InvalidPasswordError,
  EmailInUseError,
} from "../errors";

const scrypt = promisify(_scrypt);

async function checkUser(
  account_name: string,
  password: string,
): Promise<AuthUser> {
  //could be a username or email for logging in could also do this in frontent and make a second checkuser
  let contains_at = account_name.includes("@");
  let user;
  try {
    user = contains_at
      ? await User.getUserByEmail(account_name)
      : await User.getUserByUsername(account_name);
  } catch (err) {
    console.error(err);
    throw new DatabaseError("Database error");
  }

  if (user.length == 0) {
    const val = contains_at ? "email" : "username";
    throw new UserNotFoundError(val + " not in use");
  }
  const derivedKey = (
    (await scrypt(password, user[0].salt, 64)) as Buffer
  ).toString("base64");
  if (derivedKey != user[0].hash)
    throw new InvalidPasswordError("Username or passward is incorrect");
  //now get the user information from the other table
  return user[0];
}

async function createUnverifiedUser(email: string, password: string) {
  let user, unverified;
  try {
    user = await User.getUserByEmail(email); 
    unverified = await unverifiedUser.getUserByEmail(email);
  } catch (err) {
    console.error(err);
    throw new DatabaseError("Database error");
  }
  //and im not sure how good it would be to prompt a username after signing up
  
  if (unverified.length != 0) {
    let date = new Date(unverified[0].created);
    //if the verify request creation time + timeout exceeds date now the email is still waiting to be verified
    if ( Date.now() < (date.getTime()+ config.verification_timeout) ) {
      throw new EmailInUseError("Email is waiting for verification");
    }
  }
  //check the email in user after the time check for verify
  //I think this somewhat prevents users very slim chance that user clicks verification and register at the same time
  //because register would have to expire right as the verification accepted and removed the row
  if (user.length != 0) {
    throw new EmailInUseError("Email is already in use");
  }
  let salt = randomBytes(16).toString('base64');
  const derivedKey = ((await scrypt(password, salt, 64)) as Buffer).toString(
    "base64",
  );
 
  //it might be bettwe to use JWT but i dont really see a point
  //ive got to save the unverified data somewhere anyway unless i include hash salt email in the jwt but i think that would be in plain text

  let token = randomBytes(16).toString('base64url');
  try {
    await unverifiedUser.createUser(derivedKey, email, token ,salt);
  } catch (err) {
    console.error(err);
    throw new DatabaseError("Database error");
  }
  return token;
}

export default { checkUser, createUnverifiedUser };
