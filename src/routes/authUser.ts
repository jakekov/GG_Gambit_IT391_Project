import express, { Request, Response, NextFunction } from "express";
import user from "../controllers/UserController";
import {
  DatabaseError,
  EmailInUseError,
  InvalidPasswordError,
  UserNotFoundError,
} from "../errors";
const router = express.Router();

router.post("/login", async (req: Request, res: Response) => {
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
  try {
    await user.createUser(email, password);
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
  //send to whatever page is after signup needs to be a site waiting for the email authentication
  //so i guess do nothing for right now
});
