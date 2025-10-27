

/* all that is needed is to fetch the data form the databaase
backend api route thats makes post route
 */

async function updateLeaderboard() {
  try {
    console.error("files are loading")
    const response = await fetch("/api/user/leaderboard?limit=10&page=0");
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

async function verifyLogin() {
   fetch("/Login")
      .then(response => {
        // Handle potential HTTP errors
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json(); // Parse the response body as JSON
      })
      .then(data => {
        // 'data' is now a JavaScript object containing the parsed JSON
        console.log(data); // Log the entire JSON object to the console
        // You can access specific properties like this:
        // console.log(data.propertyName);
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
      });
  }




/* 
await from response 
 */