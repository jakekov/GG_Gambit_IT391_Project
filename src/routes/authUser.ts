import express, { Request, Response, NextFunction } from "express";
import user from "../controllers/userController";
import { sendMail } from "../nodemailer/mailing";
import {
  DatabaseError,
  EmailInUseError,
  InvalidPasswordError,
  UserNotFoundError,
} from "../errors";
const router = express.Router();

router.post("/login", async (req: Request, res: Response) => {
  //TODO check the verifification / resend
  //if the email fails to send the email wont be usable for expiration time
  const { account_name, password } = req.body;
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
  req.session.user = { id: acc.id, username: acc.username }; //create the auth session info
  res.json({ email: acc.email, username: acc.username });
});
// router.post("/logout", (req: Request, res: Response) => {
//   res.send("logged in as " + req.session.user?.username);
// });
router.post("/signup", async (req: Request, res: Response) => {
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
    "<html string either defined, or loaded from a html file>";
  try {
    await sendMail(from, to, subject, mailTemplate);
  } catch (err) {
    console.log("error sending verification email");
    return res.status(500).json({ error: "Internal server error" });
  }

  res.send("Check your email");
  //send to whatever page is after signup needs to be a site waiting for the email authentication
  //so i guess do nothing for right now
});
