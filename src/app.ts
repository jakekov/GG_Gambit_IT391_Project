//save in devDependencies
//npm install  --save-dev @types/express
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
const app = express();

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false, //this only creates a session if the session obj is modified
    cookie: {
      maxAge: 60000, //1 minute expire time
    },
  }),
);
app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("express server");
});

app.get("/hello", (req: Request, res: Response, next: NextFunction) => {
  res.send("hello response");
});

// fake login
app.get("/login", (req: Request, res: Response) => {
  req.session.user = { id: 1, username: "alice" }; //im pretty sure in js this just creates a new field for session at runtime but you just have to declare extradata first with typescript
  res.send("Logged in!");
});
app.get("/logout", (req: Request, res: Response) => {
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
import profileRoutes from "./routes/profile";
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
