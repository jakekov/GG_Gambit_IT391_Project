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
