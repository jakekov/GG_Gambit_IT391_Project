//use captha for signup limiting?
//verify email first
//or use express-rate-limit for the auth requests middleware

import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
//functions that make the database calls / creating auth sessions /
//use redis for sessions its in memory
//use mysql for other stuff like users and bets etc..
function create_csrf_token(
  req: Request,
  res: Response,
  next: NextFunction,
  session_id: number,
) {
  const random_value = crypto.randomBytes(64).toString("hex");
  const SESSION_ID = session_id.toString();

  const token = calc_csrf_hmac(random_value, SESSION_ID) + "." + random_value;
  res.cookie("csrf_token", token, { secure: true, httpOnly: false }); //httpfalse so the browser gets it
}
function calc_csrf_hmac(random_value: String, session_id: string) {
  const SECRET = "csrf_token";
  const message =
    session_id.length +
    "!" +
    session_id +
    "!" +
    random_value.length +
    "!" +
    random_value; // HMAC message payload
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(message);
  hmac.setEncoding("hex");
  return hmac.digest("hex");
}
function check_csrf_token(req: Request, res: Response, next: NextFunction) {
  //check if the auth session exists
  const user = req.session.user;
  if (!user) {
    return res.status(401).send("no Auth session");
  }
  const token = req.headers.X_CSRF_TOKEN;
  if (!token) {
    return res.status(401).send("No CSRF TOKEN");
  }

  const token_parts = token.split(".");
  if (token_parts.length != 2) {
    return res.status(401).send("Malformed CSRF TOKEN");
  }
  const hmac_req = token_parts[0];
  const random_value = token_parts[1];
  const calc_hmac = calc_csrf_hmac(random_value, user.id.toString());

  if (!sha_timing_safe_equals(calc_hmac, hmac_req)) {
    return res.status(401).send("HMAC AUTHENTICATION FAILED");
  }
  next();
}
export function sha_timing_safe_equals(a: string, b: string) {
  if (a.length != b.length) {
    //returning early is okay because its a sha256 length doesnt really matter
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    let x = a.charCodeAt(i);
    let y = b.charCodeAt(i);
    result |= x ^ y; //res orequals x xor y
  }
  return result === 0;
}
export default {};
