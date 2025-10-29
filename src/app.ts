//save in devDependencies
//npm install  --save-dev @types/express
//require('dotenv').config();
import express, {Request, Response, NextFunction} from 'express';
import session from 'express-session';
import user_routes from './routes/authUser.js';
import email_routes from './routes/emailVerification.js';
import google_routes from './routes/authGoogle.js';
import api_user_routes from './routes/api/user/router.js';
import api_match_routes from './routes/api/match_bet/router.js';
import {_rootDir} from './utils/esm_paths.js';
import path from 'path';
const app = express();

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false, //this only creates a session if the session obj is modified
    cookie: {
      maxAge: 900000, //15 minute expire time
      secure: false, //only create cookie if over https TODO ADD HTTPS AND SWITCH THIS TO TRUE
      sameSite: true,
      httpOnly: true, //blocks client javascript from seeing cookie
    },
  })
);

const publicPath = path.join(_rootDir, '../static');

// Serve static files
app.use(express.static(publicPath));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
  if (req.session.user == null) {
    return res.sendFile(path.join(publicPath, 'home.html'));
  }
  return res.sendFile(path.join(publicPath, 'homelogon.html'));
});

app.get('/hello', (req: Request, res: Response, next: NextFunction) => {
  res.send('hello response');
});

import profileRoutes from '@/routes/profile.js';
app.use('/', user_routes);
app.use('/email/verification', email_routes);
app.use('/profile', profileRoutes);
app.use('/auth', google_routes);
app.use('/api/user', api_user_routes); //make a secondary route file for /api
app.use('/api/matches', api_match_routes);
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(publicPath, 'dashboard.html'));
});
// Server setup
// app.listen(3000, () => {
//   console.log("Server is Running");
// });
// Serve everything inside the "public" folder at the root URL

import {create_if_not_exists} from './databases/mysql.js';
(async () => await create_if_not_exists())();

//if i wanted an auth check for a directory of sites i just add a middleware function for each request in a specific path
export default app;
