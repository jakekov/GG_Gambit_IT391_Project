//save in devDependencies
//npm install  --save-dev @types/express
require('dotenv').config();
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import user_routes from "./routes/authUser";
import email_routes from "./routes/emailVerification";
import path from "path";
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

const publicPath = path.join(__dirname, "../static");

// Serve static files
app.use(express.static(publicPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "home.html"));
});

app.get("/hello", (req: Request, res: Response, next: NextFunction) => {
  res.send("hello response");
});

import profileRoutes from "./routes/profile";
app.use("/", user_routes);
app.use("/email/verification", email_routes);
app.use("/profile", profileRoutes);
// Server setup
app.listen(3000, () => {
  console.log("Server is Running");
});
// Serve everything inside the "public" folder at the root URL

import {create_if_not_exists} from "./databases/mysql";
(async () =>  await create_if_not_exists())();

//if i wanted an auth check for a directory of sites i just add a middleware function for each request in a specific path
export default app;
