import User, { AuthUser } from "../models/userModels";
import { NextFunction, Request, Response } from "express";
import { scrypt as _scrypt, randomBytes } from "crypto";
import crypto from "crypto";
import { promisify } from "util";
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

async function createUser(email: string, password: string) {
  let user;
  try {
    user = await User.getUserByEmail(email); //This probably needs to change because username needs to be set to something
  } catch (err) {
    console.error(err);
    throw new DatabaseError("Database error");
  }
  //and im not sure how good it would be to prompt a username after signing up
  if (user.length != 0) {
    throw new EmailInUseError("Email is already in use");
  }
  let salt = randomBytes(16);
  const derivedKey = ((await scrypt(password, salt, 64)) as Buffer).toString(
    "base64",
  );
  let id;
  try {
    await User.createUser(derivedKey, email);
  } catch (err) {
    console.error(err);
    throw new DatabaseError("Database error");
  }
}

export default { checkUser, createUser };
