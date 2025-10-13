import express, { Request, Response, NextFunction } from "express";
import user from "../controllers/userController";
import { sendMail } from "../nodemailer/mailing";
import {
  DatabaseError,
  EmailInUseError,
  InvalidPasswordError,
  UserNotFoundError,
} from "../errors";
import Verified from "../models/userModels";
import UnverifiedUser from "../models/unverifiedUser";
import config from "../config/config"
import path from "path";
const staticPath = path.join(__dirname, "../../static");
const EMAIL_LINK = `https://${config.server_addr}:${config.server_port}/email/verification/verify-email/`;
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
router.use(express.urlencoded({extended: true}))
router.post("/login", async (req: Request<{},{},LoginForm>, res: Response) => {
  //TODO check the verifification / resend
  //if the email fails to send the email wont be usable for expiration time
  const { email, password } = req.body 
  if (!email) {
    res.send("Email is null");
  }
  if (!password) {
    res.send("password is null");
  }
  const account_name = email;
  let acc;
  try {
    acc = await user.checkUser(account_name, password);
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
  console.log(`logged in ${acc.email}`);
  req.session.user = { id: acc.id, username: acc.username }; //create the auth session info
  res.json({ email: acc.email, username: acc.username });
});
/**
 * Logout from the auth session
 * destroys the session
 */
router.post("/logout", (req: Request, res: Response) => {
  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error logging out");
    } else {
      res.send("Logged out");
    }
  });
});

/**
 * Singup Post Route
 * takes an email and password
 * checks if the email is already in use then takes token and sends an email with the otken in the link
 */
router.post("/signup", async (req: Request, res: Response) => {
    //this should just be error handling middleware
    // try {

    // } catch(err) {
    //     console.log(err);
    // }
  const { email, password } = req.body;



  
  let token: string | undefined;
  try {
    token = await user.createUnverifiedUser(email, password);
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
  if (!token) {
    console.log("User returned null unexpected error");
    return res.status(500).json({ error: "Internal server error" });
  }
  if (config.email_verification === false) {
    let users;
        try {
          users = await UnverifiedUser.removeUser(token); //if the link is clicked its getting removed either way
        } catch (err) {
          return res.status(500).json({ error: "Database Error" });
        }
        if (users.length == 0) {
          return res.status(403).json({ error: "Token is not valid" });
        }
        const new_user = users[0];
    try {
          await Verified.createUser(new_user, "TEMPORARY");
        } catch (err) {
          return res
            .status(500)
            .json({ error: "Database Error, Could not insert" });
        }
        console.log("verification success ", user );
        res.send("Account verified");
        return;
  }
  //send mail with nodemailer
  //setup get(:id)
  //the get needs to redirect the window waiting to enter username
  //when the username is received the account needs to go into the actual users table
  //but what happens if they fail to enter usename and go to login
  //id want the login to be successful but redirect to enter username
  //or the email verificaiton could just fail and you redo it
  //
  const from: string = "<from email ID>";
  const to: string = email;
  const subject: string = "<subject>";
  const mailTemplate: string =
    EMAIL_LINK + token; //TODO change this back from 3000 when config changes
    res.send("Check your email"); //just send the response early before checking
  try {
    await sendMail(from, to, subject, mailTemplate);
  } catch (err) {
    console.log("error sending verification email" + err);
    //then send another response if it goes bad
    return res.status(500).json({ error: "Internal server error" });
  }
  console.log("sent email to ", email);
  res.send("Check your email");
  //send to whatever page is after signup needs to be a site waiting for the email authentication
  //so i guess do nothing for right now
});

router.get("/login", (req: Request, res: Response) => {
  if (req.session.user != null) {
    //user is already logged in go to default ie dashboard account home whatever it is
    res.send("Already logged in");
  }
  res.sendFile(path.join(staticPath, 'login.html'));
});
export default router;
