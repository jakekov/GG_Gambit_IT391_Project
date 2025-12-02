# API Endpoints

A list of all the available backend API endpoints.

---

Base URL: `https://gg-gambit.duckdns.org/api` <br />
Dev URL: `http://localhost:3000/api` <br />

### User Endpoints

| Type  | Endpoint                                                     |
| :---- | :----------------------------------------------------------- |
| GET   | [`/user`](/src/routes/api/user/router.ts#L16)                |
| GET   | [`/user/get/{username}`](/src/routes/api/user/router.ts#L16) |
| GET   | [`/user/leaderboard`](/src/routes/api/user/router.ts#L16)    |
| GET   | [`/user/balance`](/src/routes/api/user/router.ts#L16)        |
| POST  | [`/user/balance`](/src/routes/api/user/router.ts#L16)        |
| PATCH | [`/user`](/src/routes/api/user/router.ts#L16)                |

### Match Betting Endpoints

| Type | Endpoint                                                   |
| :--- | :--------------------------------------------------------- |
| GET  | [`/matches/info`](/src/routes/api/match_bet/router.ts#L16) |
| POST | [`/matches/bet`](/src/routes/api/match_bet/router.ts#L16)  |
| POST | [`/matches/get`](/src/routes/api/match_bet/router.ts#L16)  |

### Auth Endpoints

| Type | Endpoint                                                          |
| :--- | :---------------------------------------------------------------- |
| GET  | [`/auth/redirect/{provider}`](/src/routes/api/auth/router.ts#L26) |
| GET  | [`/auth/callback/{provider}`](/src/routes/api/auth/router.ts#L26) |
| POST | [`/auth/login`](/src/routes/api/auth/router.ts#L26)               |
| POST | [`/auth/signup`](/src/routes/api/auth/router.ts#L26)              |
| GET  | [`/auth/logout`](/src/routes/api/auth/router.ts#L26)              |
