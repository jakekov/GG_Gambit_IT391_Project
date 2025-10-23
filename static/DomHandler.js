

/* all that is needed is to fetch the data form the databaase
backend api route thats makes post route
 */

async function updateLeaderboard() {
  try {
    const response = await fetch("http://localhost:3000/api/user/leaderboard?limit=10&page=0");
    const data = await response.json();
    const users = data.data.user_list || [];

    const getUser = (index) => users[index] || { username: "-", points: 0 };

    const ids = ["fp", "sp", "tp", "fourthp", "fifthp"];

    ids.forEach((id, index) => {
      document.getElementById(`${id}Name`).textContent = getUser(index).username;
      document.getElementById(`${id}Points`).textContent = getUser(index).points;
    });

  } catch (err) {
    console.error("Failed to update leaderboard:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateLeaderboard();
  setInterval(updateLeaderboard, 30000); 
});


/*
fetch('http://<ip>/api/user/', {
  method: 'GET',
  credentials: 'include', // include cookies/session if required
})
  .then(response => response.json())
  .then(data => {
    console.log('Current user info:', data);
  })
  .catch(error => console.error('Error fetching current user:', error));


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

*/
