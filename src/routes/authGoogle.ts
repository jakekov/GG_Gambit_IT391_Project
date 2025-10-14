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
import { redirect_google_sign_in, server_verify_id, check_sign_in_enabled } from "../controllers/googleSignIn";
const router = express.Router();

router.use(express.urlencoded({extended: true}));
router.use("/", check_sign_in_enabled);
router.get("/google/redirect/", async (req: Request<{},{},{}>, res: Response) => {
    let search_params = redirect_google_sign_in();
    //console.log(`search params: ${search_params}`);
    //const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    //url.search = search_params.toString();
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${search_params}`);
    //console.log(url.toString());
    //res.redirect(url.toString());
});
router.get("/google/callback/", async (req: Request<{},{},{}>, res: Response) => {
    let code = req.query.code as string | undefined;
    if (!code) {
        return res.status(403).json({ error: "code not defined" })
    }
    var payload;
    try {
 payload = await server_verify_id(code);
    } catch (err) {
        console.log(err);
        return res.status(403).json({error: "unable to verify google account"});
    }
    
    // This ID is unique to each Google Account, making it suitable for use as a primary key
  // during account lookup. Email is not a good choice because it can be changed by the user.
  const user_id = payload['sub'];
  // If the request specified a Google Workspace domain:
  // const domain = payload['hd'];
    console.log(user_id);
    //lookup in database
    //if exists get that account
    //if not create new account
    //create session with userid
    //
    res.send("success");
});

export default router;