import express, { Request, Response, NextFunction} from "express";

const router = express.Router();

function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (req.session.user == null) {
        return res.status(401).send("Not Logged In");
    }
    next();
}
router.use((req: Request, res: Response, next: NextFunction) => requireAuth(req,res,next));

router.get("/", (req: Request, res: Response) => {
    res.send("logged in as " + req.session.user?.username)
})
export default router;