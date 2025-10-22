// --- server.js ---

async function updateLeaderboard() {
  console.log("leaderboard");
      try {
        const response = await fetch('/api/user/leaderboard?limit=10&page=0');
        const data = await response.json();
        console.log(data);
        const users = data.data.user_list || [];

        const getUser = (index) => users[index] || { username: "-", points: 0 };

        document.getElementById("fpName").textContent = "Bobby";
        document.getElementById("fpPoints").textContent = getUser(0).points;

        document.getElementById("spName").textContent = getUser(1).username;
        document.getElementById("spPoints").textContent = getUser(1).points;

        document.getElementById("tpName").textContent = getUser(2).username;
        document.getElementById("tpPoints").textContent = getUser(2).points;

        document.getElementById("fourthpName").textContent = getUser(3).username;
        document.getElementById("fourthpPoints").textContent = getUser(3).points;

        document.getElementById("fifthpName").textContent = getUser(4).username;
        document.getElementById("fifthpPoints").textContent = getUser(4).points;

      } catch (err) {
        console.error("Failed to update leaderboard:", err);
      }
    }

    document.addEventListener("DOMContentLoaded", () => {
      updateLeaderboard();
      setInterval(updateLeaderboard, 30000);
    });

/*
---------------AI franken code---------------------------
import express from "express";
import mysql from "mysql2";

const app = express();
app.use(express.json());

// Connect to MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "mydb"
});

// Test DB connection
db.connect((err) => {
  if (err) console.error("Database connection failed:", err);
  else console.log("Connected to MySQL");
});


// --- SAVE USER ---
app.post("/api/saveUser", (req, res) => {
  const { username } = req.body;
  db.query("INSERT INTO users (name) VALUES (?)", [username], (err) => {
    if (err) return res.status(500).json({ message: "Error saving user" });
    res.json({ message: "User saved successfully!" });
  });
});


// --- GET USER INFO BY USERNAME ---
app.get("/api/user/get/:username", (req, res) => {
  const { username } = req.params;
  db.query(
    "SELECT name AS username, display_name, avatar, points FROM users WHERE name = ?",
    [username],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0)
        return res.status(404).json({ message: "User not found" });
      res.json(results[0]);
    }
  );
});


// --- GET CURRENT LOGGED-IN USER INFO (mock example) ---
app.get("/api/user", (req, res) => {
  // In a real app, you'd use session or JWT auth to identify the logged-in user.
  const currentUser = "test_user"; // placeholder
  db.query(
    "SELECT name AS username, display_name, avatar, points FROM users WHERE name = ?",
    [currentUser],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0)
        return res.status(404).json({ message: "User not found" });
      res.json(results[0]);
    }
  );
});


// --- LEADERBOARD ---
app.get("/api/user/leaderboard", (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 0;
  const offset = page * limit;

  db.query(
    `SELECT name AS username, display_name, avatar, points
     FROM users
     ORDER BY points DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({
        data: {
          user_list: results,
        },
      });
    }
  );
});


app.listen(3000, () => console.log("Server running on port 3000"));


async function updateLeaderboard() {
  try {
    const response = await fetch("http://localhost:3000/api/user/leaderboard?limit=10&page=0");
    const data = await response.json();

    // Assuming data.data.user_list is an array of user objects:
    const users = data.data.user_list;

    // Helper to safely get user data
    const getUser = (index) => users[index] || { username: "-", points: 0 };

    // First place
    document.getElementById("fpName").textContent = getUser(0).username || "N/A";
    document.getElementById("fpPoints").textContent = getUser(0).points ?? 0;

    // Second place
    document.getElementById("spName").textContent = getUser(1).username || "N/A";
    document.getElementById("spPoints").textContent = getUser(1).points ?? 0;

    // Third place
    document.getElementById("tpName").textContent = getUser(2).username || "N/A";
    document.getElementById("tpPoints").textContent = getUser(2).points ?? 0;

    // Fourth place
    document.getElementById("fourthpName").textContent = getUser(3).username || "N/A";
    document.getElementById("fourthpPoints").textContent = getUser(3).points ?? 0;

    // Fifth place
    document.getElementById("fifthpName").textContent = getUser(4).username || "N/A";
    document.getElementById("fifthpPoints").textContent = getUser(4).points ?? 0;

  } catch (err) {
    console.error("Failed to update leaderboard:", err);
  }
}

//Run immediately and refresh every 30 seconds
updateLeaderboard();
setInterval(updateLeaderboard, 30000);

/*
---------------Using node.js and express---------------------------

import express from "express";
import mysql from "mysql2";

const app = express();
app.use(express.json());

// Connect to MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "mydb"
});

app.post("/api/saveUser", (req, res) => {
  const { username } = req.body;
  db.query("INSERT INTO users (name) VALUES (?)", [username], (err) => {
    if (err) return res.status(500).json({ message: "Error saving user" });
    res.json({ message: "User saved successfully!" });
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));

---------------My Shitty code---------------------------

async function updateLeader () {
    //these names and points will be updated from informaiton form the database
document.getElementById("fpName").innerHTML = "Jacob";
document.getElementById("spName").innerHTML = "Ben";
document.getElementById("tpName").innerHTML = "Nick";
document.getElementById("fourthpName").innerHTML = "Kyle";
document.getElementById("fifthpName").innerHTML = "Kevin";

document.getElementById("fpPoints").innerHTML = "2000";
document.getElementById("spPoints").innerHTML = "1900";
document.getElementById("tpPoints").innerHTML = "1800";
document.getElementById("fourthpPoints").innerHTML = "1700";
document.getElementById("fifthpPoints").innerHTML = "1600";
}

updateLeader();
*/