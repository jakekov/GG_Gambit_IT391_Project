//save in devDependencies
//npm install  --save-dev @types/express
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import user_routes from "./routes/authUser";
import email_routes from "./routes/emailVerification";
const app = express();

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false, //this only creates a session if the session obj is modified
    cookie: {
      maxAge: 900000, //15 minute expire time
      secure: true, //only create cookie if over https
      sameSite: true,
      httpOnly: true, //blocks client javascript from seeing cookie
    },
  }),
);
app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("express server");
});

app.get("/hello", (req: Request, res: Response, next: NextFunction) => {
  res.send("hello response");
});

import profileRoutes from "./routes/profile";
app.use("/user", user_routes);
app.use("email/verification", email_routes);
app.use("/profile", profileRoutes);
// Server setup
app.listen(3000, () => {
  console.log("Server is Running");
});
// Serve everything inside the "public" folder at the root URL
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

//if i wanted an auth check for a directory of sites i just add a middleware function for each request in a specific path
export default app;
