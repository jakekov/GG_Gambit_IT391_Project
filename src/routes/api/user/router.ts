



//what routes to get
//this is going to be /api/user
// / will get teh sessions user
// /:slug will get the user with that id | username (clicking on the profile of someone on the leaderboard)
// /leaderboard //get list of users ?limit ?page //returns list of profiles with leaderboard info
// the points or whatever is going to be a seperate table so updates are quicker
//index by uuid

import express, { Request, Response, NextFunction } from "express";
import { getUserProfileData } from "./controllers/profile";

const router = express.Router();

router.get("/", getUser);
router.get("/:slug", getUser);

router.get("/leaderboard", (req: Request<{},{}, {limit: number, page: number}>, res: Response) => {
    req.query.limit;
});

async function getUser(req: Request, res: Response) {
    try {
        const id = req.params.slug || req.session.user?.id;
        if (!id) return res.status(400).json({ error: "Bad request" });

        const user = await getUserProfileData(id);
        return res.status(user.status).json(user.data);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}
export default router;