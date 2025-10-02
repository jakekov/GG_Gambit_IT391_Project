//this route should be protected with middleware that checks the token and jwt verifies it

//signup verfication
//account reset verification
// password account reset
//2FA?
import config from "../config/config";
import UnverifiedUser from "../models/unverifiedUser";
import Verified from "../models/userModels";

import express, { Request, Response, NextFunction } from "express";
import { sendMail } from "../nodemailer/mailing";

const router = express.Router();
router.get("/hello", (req: Request, res: Response, next: NextFunction) => {
  res.send("hello response");
});
router.get("/testemail", async(req: Request, res: Response) => {
     const from: string = "Gg.gambit.noreply@gmail.com";
      const to: string = "shfloopyuh@gmail.com";
      const subject: string = "TEST";
      const mailTemplate: string =
        "<html string either defined, or loaded from a html file>";
      try {
        await sendMail(from, to, subject, mailTemplate);
      } catch (err) {
        console.log("error sending verification email" + err);
        return res.status(500).json({ error: "Internal server error" });
      }
    res.send("Sent email");
});
//you knwo what a much better idea is
//make a table with the id to verified status cause you only need to check it on login / register
//or maybe just do it with username so users doesnt have a null value
//
/**
 * Get route for email verfication link
 * Email is sent with the token at the end of the link
 * this will take a user from unverfied table to verified
 */
router.get("/verify-email/:token",
  async (req: Request<{ token: string }>, res: Response) => {
    let users;
    try {
      users = await UnverifiedUser.getUserByToken(req.params.token);
    } catch (err) {
      return res.status(500).json({ error: "Database Error" });
    }
    if (users.length == 0) {
      return res.status(403).json({ error: "Token is not valid" });
    }
    const user = users[0];
    let date = new Date(user.created);
    //if the verify request creation time + timeout exceeds date now the email dont accept the verification
    if (Date.now() >= date.getTime() + config.verification_timeout) {
      return res.status(403).json({ error: "Token is expired" });
    }
    //might be worth to do one last sanity check that no username or email exists already
    //maybe make username nullable then login could redirect to set username prompt
    try {
      Verified.createUser(user, "TEMPORARY");
    } catch (err) {
      return res
        .status(500)
        .json({ error: "Database Error, Could not insert" });
    }
    //try to send the browser waiting on verification into login or log them in automatically
  });
export default router;
