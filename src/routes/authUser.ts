import express, { Request, Response, NextFunction } from "express";
import user from "../controllers/userController";
import { User } from "../models/user";
import { sendMail } from "../nodemailer/mailing";
import {
  DatabaseError,
  EmailInUseError,
  InvalidPasswordError,
  UserNotFoundError,
} from "../errors";
import { AuthProvider } from "../models/authProviders";
import config from "../config/config";
import path from "path";
import email_controller from "../controllers/emailController";
import { EmailConformationString } from "../models/email_tokens";
import { stringify as uuidStringify } from "uuid";
import { badRequest, internalServerError } from "@/http";
const staticPath = path.join(__dirname, "../../static");
const EMAIL_LINK = `${config.http}://${config.server_addr}:${config.server_port}/email/verification/verify-email/`;
const router = express.Router();
interface LoginForm {
  email: string;
  password: string;
}

/**
 * Login Post Route
 * Should include account_name (email or username) and password
 * checks if the user is correct and gives the session a user meant for authentication checks
 *
 */

router.post(
  "/login",
  async (req: Request<{}, {}, LoginForm>, res: Response) => {
    //TODO check the verifification / resend
    //if the email fails to send the email wont be usable for expiration time
    if (!req.body) {
      return badRequest(res, "Body is undefined");
    }
    const { email, password } = req.body;
    if (!email || !password) {
      return badRequest(res);
    }

    const account_name = email;
    let acc: AuthProvider | undefined;
    try {
      acc = await user.checkUserCredentials(account_name, password);
    } catch (err) {
      if (
        err instanceof UserNotFoundError ||
        err instanceof InvalidPasswordError
      ) {
        // Expected auth errors → send 401
        return res.status(401).json({ error: err.message });
      } else if (err instanceof DatabaseError) {
        return res.status(500).json({ error: err.message });
      }
      console.log("unexpected error ");
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
    let profile: User;
    try {
      profile = await user.verifyAccount(acc);
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        return res.status(401).json({ error: err.message });
      } else if (err instanceof DatabaseError) {
        console.log(err);
        return res.status(500).json({ error: err.message });
      }
      console.log("unexpected error ");
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }

    console.log(`logged in ${profile.email}`);
    req.session.user = {
      id: uuidStringify(profile.id),
      username: profile.username,
      id_buf: profile.id,
    }; //create the auth session info
    res.cookie("isAuthenticated", "true", { sameSite: "lax" });
    res.status(200).json({ email: profile.email, username: profile.username });
  }
);
/**
 * Logout from the auth session
 * destroys the session
 */
router.get("/logout", (req: Request, res: Response) => {
  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error logging out");
    } else {
      res.clearCookie("isAuthenticated");
      res.send("Logged out");
    }
  });
});

interface SignupForm {
  username: string;
  email: string;
  password: string;
}
/**
 * Singup Post Route
 * takes an email and password
 * checks if the email is already in use then takes token and sends an email with the otken in the link
 */
router.post(
  "/signup",
  async (req: Request<{}, {}, SignupForm>, res: Response) => {
    const { username, email, password } = req.body;
    try {
      //need to create an account if none exists using the password
      //createLocalAuth checks if localAuth already exists
      //but i need to remove the account if localAuth fails
      if (!email || !password || !username) return badRequest(res);

      await user.LocalAuthOrNewAccount(username, email, password);
    } catch (err) {
      if (err instanceof EmailInUseError) {
        // Expected auth errors → send 401
        return res.status(401).json({ error: err.message });
      } else if (err instanceof DatabaseError) {
        return res.status(500).json({ error: err.message });
      }
      console.log("unexpected error ");
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (config.email_verification === true) {
      //update the email_verified for the account
      var token = null;
      try {
        token = await email_controller.generateEmailVerificationToken(
          email,
          EmailConformationString.verify_account
        );
      } catch (err) {
        console.log("email verification failed but account created");
        return res.status(500).json({ error: "Internal server error" });
      }
      if (!token) {
        console.log("token is null but account is created");
        return res.status(500).json({ error: "Internal server error" });
      }
      const from: string = "<from email ID>";
      const to: string = email;
      const subject: string = "<subject>";
      const mailTemplate: string = EMAIL_LINK + token; //TODO change this back from 3000 when config changes
      res.send("Check your email"); //just send the response early before checking
      try {
        await sendMail(from, to, subject, mailTemplate);
      } catch (err) {
        console.log("error sending verification email" + err);
        //then send another response if it goes bad
        return res.status(500).json({ error: "Internal server error" });
      }
      console.log("sent email to ", email);
      return;
    }
    res.send("Creation success");
    //send to whatever page is after signup needs to be a site waiting for the email authentication
    //so i guess do nothing for right now
  }
);

router.get("/login", (req: Request, res: Response) => {
  if (req.session.user != null) {
    //user is already logged in go to default ie dashboard account home whatever it is
    res.send("Already logged in");
  }
  res.sendFile(path.join(staticPath, "login.html"));
});
//submit route where user enters email to get a reqeust in their email
router.post("/password/reset", postPasswordReset);
async function postPasswordReset(
  req: Request<{}, {}, { email?: string }>,
  res: Response
) {
  let email = req.body.email;
  if (!email) return badRequest(res);
  try {
    user.passwordResetEmail(email);
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(200).json({
        data: "If a user exists for the account a password reset email was sent",
      });
    }
    console.log(err);
    internalServerError(res);
  }
  return res.status(200).json({
    data: "If a user exists for the account a password reset email was sent",
  });
}
export default router;
