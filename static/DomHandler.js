/* 
  Handles leaderboard updates and optional login verification.
  Fetches data from backend API if available, otherwise uses fallback mock data.
*/

async function updateLeaderboard() {
  try {
    console.log("Leaderboard update initialized...");

    // Try fetching from backend API
    const response = await fetch("/api/user/leaderboard?limit=10&page=0");
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const users = data?.data?.user_list || [];

    // If no data is returned, fall back to mock data
    if (users.length === 0) {
      console.warn("No leaderboard data found — using mock data.");
      users.push(
        { username: "Alice", points: 1500 },
        { username: "Bob", points: 1200 },
        { username: "Charlie", points: 1000 },
        { username: "Diana", points: 1000 },
        { username: "Evan", points: 800 }
      );
    }

    const getUser = (index) => users[index] || { username: "-", points: 0 };
    const ids = ["fp", "sp", "tp", "fourthp", "fifthp"];

    ids.forEach((id, index) => {
      const nameEl = document.getElementById(`${id}Name`);
      const pointsEl = document.getElementById(`${id}Points`);

      if (nameEl && pointsEl) {
        nameEl.textContent = getUser(index).username;
        pointsEl.textContent = getUser(index).points;
      }
    });

  } catch (err) {
    console.warn("Leaderboard fetch failed — using fallback data:", err);

    // Fallback mock data for local testing
    const fallbackUsers = [
      { username: "Alice", points: 1500 },
      { username: "Bob", points: 1200 },
      { username: "Charlie", points: 1000 },
      { username: "Diana", points: 1000 },
      { username: "Evan", points: 800 },
    ];

    const ids = ["fp", "sp", "tp", "fourthp", "fifthp"];
    fallbackUsers.forEach((user, index) => {
      const nameEl = document.getElementById(`${ids[index]}Name`);
      const pointsEl = document.getElementById(`${ids[index]}Points`);

      if (nameEl && pointsEl) {
        nameEl.textContent = user.username;
        pointsEl.textContent = user.points;
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateLeaderboard();
  setInterval(updateLeaderboard, 30000); // Refresh every 30 seconds
});

async function verifyLogin() {
  try {
    const response = await fetch("/login"); // lowercase endpoint
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Login verification data:", data);

  } catch (error) {
    console.error("There was a problem with the login fetch operation:", error);
  }
}

/*function renderSelectedBets(betsArray) {
  const container = document.getElementById("selectedBetsContainer");

  if (!container) {
    console.error("Container #selectedBetsContainer not found.");
    return;
  }

  container.innerHTML = betsArray.map(bet => `
    <div class="bet-row d-flex justify-content-between align-items-center border-bottom border-secondary py-2 px-2 rounded">
      <div class="team-info d-flex align-items-center">
        <img src="${bet.img}" alt="${bet.teamA}" width="40" 
             class="me-2 rounded-circle border border-success">
        <div>
          <span class="fw-bold">${bet.teamA}</span>
          <span class="text-secondary">vs</span>
          <span class="fw-bold">${bet.teamB}</span>
        </div>
      </div>
      <div class="d-flex align-items-center">
        <span class="odds text-success fw-bold me-2">${bet.odds}</span>
      </div>
    </div>
  `).join("");
}

//get info from api for user selected teams

const bets = [
  { teamA: "Team test", teamB: "Team B", odds: "+150", img: "images/team1.png" },
  { teamA: "Team C", teamB: "Team D", odds: "-110", img: "images/team1.png" },
  { teamA: "Team X", teamB: "Team Y", odds: "+200", img: "images/team1.png" },

];

renderSelectedBets(bets);
*/

async function loadBets() {
  try {
    const res = await fetch("/api/matches/get");
    const json = await res.json();

    if (!json.data) return;

    const container = document.getElementById("selectedBetsContainer");

    json.data.forEach(bet => {
      const id = bet.match_id;

      // If the row doesn’t exist yet → create it
      if (!document.getElementById(`bet-${id}`)) {
        container.insertAdjacentHTML(
          "beforeend",
          `
          <div class="bet-row border-bottom border-secondary py-3 px-2 rounded" id="bet-${id}">
            <div class="d-flex justify-content-between">
            
              <!-- TEAMS SIDE -->
              <div class="teams d-flex align-items-center gap-3">
                <div class="team d-flex align-items-center">
                  <img id="bet-${id}-team-a-img" src="" width="45" class="rounded-circle border border-success me-2">
                  <span id="bet-${id}-team-a-name" class="fw-bold"></span>
                </div>

                <span class="fw-bold text-secondary mx-2">VS</span>

                <div class="team d-flex align-items-center">
                  <img id="bet-${id}-team-b-img" src="" width="45" class="rounded-circle border border-danger me-2">
                  <span id="bet-${id}-team-b-name" class="fw-bold"></span>
                </div>
              </div>

              <!-- BET DATA SIDE -->
              <div class="bet-data text-end">
                <div>
                  <span class="text-info fw-bold">Chosen:</span>
                  <span id="bet-${id}-chosen" class="fw-bold"></span>
                </div>

                <div>
                  <span class="text-warning fw-bold">Amount:</span>
                  <span id="bet-${id}-amount" class="fw-bold"></span>
                </div>

                <div>
                  <span class="text-success fw-bold">Payout:</span>
                  <span id="bet-${id}-payout" class="fw-bold"></span>
                </div>

                <div>
                  <span class="text-secondary fw-bold">Ended:</span>
                  <span id="bet-${id}-ended" class="ended-status fw-bold"></span>
                </div>
              </div>

            </div>
          </div>
          `
        );
      }

      // Update DOM values
      document.getElementById(`bet-${id}-team-a-name`).textContent = bet.team_a;
      document.getElementById(`bet-${id}-team-a-img`).src = bet.img_a;

      document.getElementById(`bet-${id}-team-b-name`).textContent = bet.team_b;
      document.getElementById(`bet-${id}-team-b-img`).src = bet.img_b;

      // Convert prediction (a/b) into team name
      const chosenTeam =
        bet.prediction === "a" ? bet.team_a :
        bet.prediction === "b" ? bet.team_b :
        "Unknown";

      document.getElementById(`bet-${id}-chosen`).textContent = chosenTeam;

      // Money formatting
      document.getElementById(`bet-${id}-amount`).textContent = `$${bet.bet_amount}`;
      document.getElementById(`bet-${id}-payout`).textContent = `$${bet.payout.toFixed(2)}`;

      // Ended status
      const endedEl = document.getElementById(`bet-${id}-ended`);
      if (bet.ended === 1) {
        endedEl.textContent = "Yes";
        endedEl.classList.remove("text-success");
        endedEl.classList.add("text-danger");
      } else {
        endedEl.textContent = "No";
        endedEl.classList.remove("text-danger");
        endedEl.classList.add("text-success");
      }

    });

  } catch (err) {
    console.error("Failed to load bets:", err);
  }
}

loadBets();
setInterval(loadBets, 5000); // refresh every 5 seconds

