

window.addEventListener("DOMContentLoaded", domLoaded);
const matchArrayPromise = fetchTodos();
const teamArrayPromise = fetchTeamTodos();
async function domLoaded() {
  console.log("hi");
  const matchArray = await matchArrayPromise;

  console.log(matchArray);
  generateMatches(matchArray);
  const teamArray = await teamArrayPromise;
  infoLoadedUpdateMatches(teamArray.data);
  //updateMatches(matchArray, teamArray);



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

  document.addEventListener("click", async function (e) {
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
      try {
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
function findMatch(matchInfoArr, matchIdstr) {
  const numid = parseInt(matchIdstr);
  for (let i = 0; i < matchInfoArr.length; i++) {
    if (matchInfoArr[i].MatchID === numid) return i
  }
  return -1;
}
function infoLoadedUpdateMatches(matchInfoArr) {
  const matches = document.querySelectorAll(".match");
  REALindex = 0;
  for (const matchEl of matches) {
    const matchId = matchEl.id;
    const idx = findMatch(matchInfoArr, matchId);
    if (idx == -1) continue;
    // ---- Team buttons ----
    const team1Btn = matchEl.querySelector(".team1.bet-btn");
    const team2Btn = matchEl.querySelector(".team2.bet-btn");

    // Dataset fields (teamName, teamId, matchId)
    team1Btn.dataset.teamId = matchInfoArr[idx].Team1ID;
    team1Btn.dataset.matchId = matchId;
    team2Btn.dataset.teamId = matchInfoArr[idx].Team2ID;
    team2Btn.dataset.matchId = matchId;
    // ---- Images ----
    const team1Img = matchEl.querySelector(".match-team:nth-child(1) img");
    const team2Img = matchEl.querySelector(".match-team:nth-child(3) img");
    team1Img.src = matchInfoArr[idx].Team1Img;
    team2Img.src = matchInfoArr[idx].Team2Img;

    // ---- Odds ----
    const team1OddsEl = matchEl.querySelector(".team1-odds");
    const team2OddsEl = matchEl.querySelector(".team2-odds");
    team1OddsEl.textContent = matchInfoArr[idx].BetOdds
    t2odds = Number(matchInfoArr[idx].BetOdds);
    t2odds = t2odds * -1;
    team2OddsEl.textContent = t2odds;
  }

}

async function updateMatches(matchArray, teamStuff) {
  console.log(matchArray);
  const matches = document.querySelectorAll(".match");
  console.log(matches);
  REALindex = 0;

  for (index = 0; REALindex < 10; index++) {

    const matchData = matchArray.data[index];
    const teamdata = teamStuff.data[index];
    console.log(teamdata.CurrentStatus);
    if (teamdata.CurrentStatus.toLowerCase() == "upcoming") {
      const matchElement = matches[REALindex];
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

      //making bet odds
      const team1OddsEl = matchElement.querySelector(".team1-odds");
      const team2OddsEl = matchElement.querySelector(".team2-odds");

      // --- UPDATE TEAM NAMES ---
      if (team1Span) team1Span.textContent = matchData.teams[0].name;
      if (team2Span) team2Span.textContent = matchData.teams[1].name;

      // --- UPDATE TEAM IMAGES ---
      if (imgElements[0]) imgElements[0].src = teamdata.Team1Img;
      if (imgElements[1]) imgElements[1].src = teamdata.Team2Img;

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
      //update betting odds
      team1OddsEl.textContent = teamdata.BetOdds
      t2odds = Number(teamdata.BetOdds);
      t2odds = t2odds * -1;
      team2OddsEl.textContent = t2odds;
      REALindex++;
      console.log(REALindex);
    }
  };
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
function generateMatches(vlr_matches) {
  const container = document.getElementById("matches-container-main");
  for (const match of vlr_matches.data) {
    if (match.status.toLowerCase() !== "upcoming") continue;
    const element = createMatchHTML(match.id, match.teams[0].name, match.teams[1].name, match.tournament, match.in);
    container.appendChild(element);
  }
}
function createMatchHTML(matchId, teamAName, teamBName, tournamentName, in_time) {
  const template = document.createElement("template");
  template.innerHTML = `
    <div class="match" id="${matchId}">
        <div class="match-team">
            <img alt="${teamAName}">
            <span id="team1">${teamAName}</span>

            <button 
                class="bet-btn btn btn-primary team1"
                data-teamName=${teamAName}"
                data-matchId=${matchId}
                data-teamId="-1"
                data-bs-toggle="popover"
                data-bs-placement="right"
                title="Place Your Bet"
                data-bs-content='<input type="number" class="form-control bet-input" placeholder="Enter amount"><button class="btn btn-success btn-sm mt-2">Confirm</button>'>
                Bet
            </button>

            <div class="odds-container">
                <span class="team1-odds">Odds: --</span>
            </div>
        </div>

        <div class="d-block">
          <span class="vs">vs</span>
          
        </div>

        <div class="match-team">
            <img alt="${teamBName}">
            <span id="team2">${teamBName}</span>

            <button 
                class="bet-btn btn btn-primary team2"
                data-teamName=${teamBName}"
                data-matchId=${matchId}
                data-teamId="-1"
                data-bs-toggle="popover"
                data-bs-placement="right"
                title="Place Your Bet"
                data-bs-content='<input type="number" class="form-control bet-input" placeholder="Enter amount"><button class="btn btn-success btn-sm mt-2">Confirm</button>'>
                Bet
            </button>

            <div class="odds-container">
                <span class="team2-odds">Odds: --</span>
            </div>
        </div>
        <div class= "match-time">In: ${in_time}</div>
        <div class="tournament" id="tournamentname">${tournamentName}</div>
    </div>
    `.trim();

  return template.content.firstElementChild; // return DOM node
}