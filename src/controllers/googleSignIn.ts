import config, { google_sign_in }  from "../config/config";
import { Request, Response, NextFunction } from "express";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import {
  UserNotFoundError,
  DatabaseError,
  InvalidPasswordError,
  EmailInUseError,
} from "../errors";
//this is definitly not the best way to do this but im not sure what is
const GOOGLE_REDIRECT_LINK = `https://${config.server_addr}:${config.server_port}/auth/google/callback/`;
const client = new OAuth2Client();

export function check_sign_in_enabled(req: Request, res: Response, next: NextFunction) {
    if (!google_sign_in.ENABLED) {
        return res.send("Google Sign in is not configured");
    }
    next();
}
interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: "Bearer";
  id_token: string;
}
export function redirect_google_sign_in(): URLSearchParams {
  const params = new URLSearchParams({
    client_id: google_sign_in.GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_LINK,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent"
  });
  return params;
}

export async function server_verify_id(code: string): Promise<TokenPayload>  {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: google_sign_in.GOOGLE_CLIENT_ID,
      client_secret: google_sign_in.GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_LINK,
      grant_type: "authorization_code"
    })
  });
  var tokens: GoogleTokenResponse;
  try {
    tokens = await response.json() as GoogleTokenResponse ;
  } catch (err) {
    throw new Error("invalid token"); 
  }
  
  const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: google_sign_in.GOOGLE_CLIENT_ID,  // Specify the WEB_CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error("Could not get payload");
  }
  
  return payload;
 
}