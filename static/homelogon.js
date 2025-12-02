

window.addEventListener("DOMContentLoaded", domLoaded);

async function domLoaded(){
console.log("hi");
const matchArray =  await fetchTodos();
const teamArray = await fetchTeamTodos()
//console.log(teamArray);
updateMatches(matchArray, teamArray);



 const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
 
popoverTriggerList.forEach(btn => {
  const pop = new bootstrap.Popover(btn, { 
    html: true, 
    sanitize: false 
  });

  btn.addEventListener("click", () => {
    bootstrap.Popover._activeTriggerBtn = btn;
  });
});
  popoverTriggerList.forEach((popoverTriggerEl) => {
    new bootstrap.Popover(popoverTriggerEl, {
      html: true,
      sanitize: false, // allow input HTML
      placement: 'right',
      content: `
        <div style="width: 160px;">
          <label class="form-label mb-1">Enter amount:</label>
          <input type="number" class="form-control form-control-sm bet-input" placeholder="e.g. 25">
          <button class="btn btn-success btn-sm mt-2 w-100">Confirm</button>
        </div>
      `
    });
  });

  document.addEventListener('click', function (e) {
  if (e.target.closest('.popover') || e.target.matches('[data-bs-toggle="popover"]')) {
    e.stopPropagation(); // don’t close popover when interacting inside it
  } else {
    // Close all open popovers
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach(btn => {
      bootstrap.Popover.getInstance(btn)?.hide();
    });
  }
  });

  // button.addEventListener("click", (event) => {
  //     event.stopPropagation(); // prevent global click listener from hiding it
  //     const popover = bootstrap.Popover.getInstance(button);
  //     popover.toggle();
  //   });

 document.addEventListener("click", async function(e) {
  if (e.target.matches(".btn-success")) {

    const popover = e.target.closest('.popover');
    const input = popover.querySelector('.bet-input');
    const amount = input.value;

    if (!amount) {
      alert("Please enter a bet amount!");
      return;
    }

    // get the original triggering button
    const triggerBtn = bootstrap.Popover._activeTriggerBtn;

    const teamName = triggerBtn.dataset.teamName;
    const teamId = triggerBtn.dataset.teamId;
    const matchId = triggerBtn.dataset.matchId;

    // console.log("BET PLACED:");
    // console.log("Amount:", amount);
    // console.log("Team Name:", teamName);
    // console.log("Team ID:", teamId);
    // console.log("Match ID:", matchId);
 
 const BettingStats = {
  match_id: parseInt(matchId),
  team_winning: parseInt(teamId),
  wager: parseInt(amount)
};

  console.log(BettingStats);
  const thing = JSON.stringify(BettingStats);
  console.log(thing);
  var newresponse;
  try{
   newresponse = await fetch("/api/matches/bet", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(BettingStats)
});
} catch (error) { 
  console.log(error);
}
console.log(newresponse);

const data = await newresponse.json();
console.log(data);


}
});


   document.addEventListener("click", (event) => {
    const isPopover = event.target.closest(".popover");
    const isButton = event.target.matches('[data-bs-toggle="popover"]');
    if (!isPopover && !isButton) {
      // Clicked outside — close all open popovers
      document.querySelectorAll('[data-bs-toggle="popover"]').forEach(btn => {
        const pop = bootstrap.Popover.getInstance(btn);
        if (pop) pop.hide();
      });
    }
  });


  
}



async function updateMatches(matchArray,teamStuff) {
  const matches = document.querySelectorAll(".match");
  console.log(teamStuff);
  

  matches.forEach((matchElement, index) => {
    const matchData = matchArray.data[index];
    const teamdata = teamStuff.data[index]
    console.log(teamdata);
    if (!matchData) return;

    // team name spans
    const team1Span = matchElement.querySelector('[id="team1"]');
    const team2Span = matchElement.querySelector('[id="team2"]');

    // team images (2 images inside .match-team)
    const imgElements = matchElement.querySelectorAll('.match-team img');

    // tournament name
    const tournamentElement = matchElement.querySelector('.tournament');

    // bet buttons inside this match
    const team1Btn = matchElement.querySelector(".team1");
    const team2Btn = matchElement.querySelector(".team2");

    // --- UPDATE TEAM NAMES ---
    if (team1Span) team1Span.textContent = matchData.teams[0].name;
    if (team2Span) team2Span.textContent = matchData.teams[1].name;

    // --- UPDATE TEAM IMAGES ---
    if (imgElements[0]) imgElements[0].src = matchData.img;
    if (imgElements[1]) imgElements[1].src = matchData.img;

    // --- TOURNAMENT TITLE ---
    if (tournamentElement) {
      tournamentElement.textContent = matchData.tournament;
    }

    // --- PASS METADATA TO POPUP BET BUTTONS ---
    if (team1Btn) {
      
      team1Btn.dataset.teamName = matchData.teams[0].name;
      team1Btn.dataset.teamId = teamdata.Team1ID;
      //console.log(team1Btn.dataset.teamId)
      team1Btn.dataset.matchId = matchData.id;
    
    }

    if (team2Btn) {
      team2Btn.dataset.teamName = matchData.teams[1].name;
      team2Btn.dataset.teamId = teamdata.Team2ID;
      //console.log(team2Btn.dataset.teamId)
      team2Btn.dataset.matchId = matchData.id;
      
    }
  });
}



async function fetchTodos() {
    
  try {
    const data = await fetch("https://vlr.orlandomm.net/api/v1/matches");
    if (!data.ok) {
      throw new Error("Network response was not OK");
    }
    
    
    const todos = await data.json();
    
    console.log(todos);
    console.log(data);

    const matchArray = {
      status: todos.status,
      size: todos.size,
      data: todos.data.map(match => ({
        id: match.id,
        teams: match.teams.map(team => ({
          name: team.name,
          country: team.country,
          score: team.score
        })),
        status: match.status,
        event: match.event,
        tournament: match.tournament,
        img: match.img,
        in: match.in
      }))
    };
    console.log(matchArray);
    return matchArray;
    
  } catch (error) {
    console.error("There was a problem with your fetch request: ", error)
  }
  
}

async function fetchTeamTodos() {
  const res = await fetch("api/matches/info");
  if (!res.ok) {
    throw new Error("Network response was not OK");
  }

  const todos = await res.json();
  console.log(todos);
  const teamArray = {
    status: todos.status,
    size: todos.size,
    data: todos.data.map(match => ({
      MatchID: match.match_id,
      Team1ID: match.a_id,
      Team1Name: match.a_name,
      Team1Img: match.a_img,
      Team2ID: match.b_id,
      Team2Name: match.b_name,
      Team2Img: match.b_img,
      BetOdds: match.odds,
      CurrentStatus: match.status,
      MatchStart: match.match_start
    }))
  };
console.log(teamArray);
  return teamArray; // return it if needed
}
