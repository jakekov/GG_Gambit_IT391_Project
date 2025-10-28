window.addEventListener("DOMContentLoaded", domLoaded);

async function domLoaded(){
console.log("hi");
const matchArray =  await fetchTodos();
console.log(matchArray);
updateMatches(matchArray);


 const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
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

  button.addEventListener("click", (event) => {
      event.stopPropagation(); // prevent global click listener from hiding it
      const popover = bootstrap.Popover.getInstance(button);
      popover.toggle();
    });

  document.addEventListener("click", function(e) {
    if (e.target.matches(".btn-success")) {
      const input = e.target.closest('.popover').querySelector('.bet-input');
      const amount = input.value;
      if (amount) {
        alert(`You bet $${amount}!`);
      } else {
        alert("Please enter a bet amount first!");
      }
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



function updateMatches(matchArray){
    const matches = document.querySelectorAll('.match');

matches.forEach((matchElement, index) => {
  const matchData = matchArray.data[index];
  if (!matchData) return; // Skip if not enough matches in array

  // Select the team spans and images in this match
  const teamSpans = matchElement.querySelectorAll('.match-team span');
  const imgElements = matchElement.querySelectorAll('.match-team img');
  const tournamentElement = matchElement.querySelector('.tournament');

  // ✅ Update team names
  if (teamSpans[0]) teamSpans[0].textContent = matchData.teams[0].name;
  if (teamSpans[1]) teamSpans[1].textContent = matchData.teams[1].name;

  // ✅ Update images (you can set different ones if your data has two)
  if (imgElements[0]) imgElements[0].src = matchData.img;
  if (imgElements[1]) imgElements[1].src = matchData.img;

  // ✅ Update tournament name
  if (tournamentElement) tournamentElement.textContent = matchData.tournament;
});

console.log(matchArray);
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