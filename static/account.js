// --- Elements ---
const avatarInputs = document.querySelectorAll('input[name="avatar"]');
const avatarPreview = document.getElementById('avatarPreview');
const usernameInput = document.getElementById('username');
const usernamePreview = document.getElementById('usernamePreview');
const resetButton = document.getElementById('resetProfile');
const form = document.getElementById('profileForm');
const creditDisplay = document.getElementById('userCredit');
const modalCreditDisplay = document.getElementById('modalUserCredit');
const addCreditButton = document.getElementById('addCredit');
const withdrawButton = document.getElementById('withdrawFunds');
const saveAvatarBtn = document.getElementById('saveAvatarBtn');

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

// --- State ---
let userCredit = 0;
let tempSelectedAvatar = defaultAvatar;

// --- Initialize Bootstrap modal ---
let modalEl = document.getElementById('avatarModal');
let avatarModal = new bootstrap.Modal(modalEl);

async function waitForUser() {
  let usr = fetch("/api/user/");
  let bal = fetch("/api/user/balance");
  let user = await usr;
  if (!user.ok) {
    return null;
  }
  let balance = await bal
  if (!balance.ok) {
    return null
  }
  let obj = await user.json();
  let bala = await balance.json();
  obj.balance = bala;

  return obj

}
let UserObj = null;
let loggedInUser = waitForUser();
async function saveProfileInfo(username, avatar_url) {

  let res = await fetch("/api/user/", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username: username, avatar: avatar_url })
  })
  return res
}
// --- Initialize page ---
window.addEventListener('DOMContentLoaded', async () => {
  UserObj = await loggedInUser;
  // const savedUsername = localStorage.getItem('username');
  // const savedAvatar = localStorage.getItem('avatar');
  // const savedCredit = localStorage.getItem('credit');
  // const savedEmail = localStorage.getItem('email');
  const savedUsername = UserObj.username;
  const savedAvatar = UserObj.avatar || tempSelectedAvatar;
  const savedCredit = UserObj.balance.balance;
  const savedEmail = null;

  // Credits
  if (savedCredit) {
    userCredit = parseInt(savedCredit);
    creditDisplay.textContent = userCredit;
  }

  // Avatar
  avatarPreview.innerHTML = `<img src="${savedAvatar || defaultAvatar}" alt="Avatar">`;
  avatarInputs.forEach(input => {
    if (input.value === savedAvatar) input.checked = true;
  });

  // Username
  if (savedUsername) {
    usernameInput.value = savedUsername;
    usernamePreview.textContent = savedUsername;
  }
});

// --- Username input ---
usernameInput.addEventListener('input', async () => {
  const value = usernameInput.value.trim();
  usernamePreview.textContent = value || "No Username";
  //await saveProfileInfo(value, undefined); //idk i think not including it makes it undefined
  // localStorage.setItem('username', value);
  // localStorage.setItem('email', userEmail);
});

// --- Profile form submit ---
form.addEventListener('submit', async e => {
  e.preventDefault();
  const value = usernameInput.value.trim();
  usernamePreview.textContent = value || "No Username";
  let res = await saveProfileInfo(value, undefined);
  let resj = await res.json();
  if (res.ok) {
    alert("Profile saved successfully!");
  } else {
    console.log(resj)
    alert(JSON.stringify(resj))
  }

});


// Show the confirmation modal only
document.getElementById("resetProfile").addEventListener("click", function () {
  const deleteModal = new bootstrap.Modal(document.getElementById("deleteAccountModal"));
  deleteModal.show();
});

// When the user confirms deletion
document.getElementById("confirmDeleteBtn").addEventListener("click", function () {
  localStorage.clear();
  usernameInput.value = "";
  usernamePreview.textContent = "No Username";
  avatarPreview.innerHTML = `<img src="${defaultAvatar}" alt="Default Avatar">`;
  avatarInputs.forEach(input => input.checked = false);
  creditDisplay.textContent = "0";
  userCredit = 0;
  tempSelectedAvatar = defaultAvatar;

  // Close the modal after cleanup
  const deleteModal = bootstrap.Modal.getInstance(document.getElementById("deleteAccountModal"));
  deleteModal.hide();

  alert("Account deleted successfully.");
});



// --- Add Funds Modal Logic ---
const addFundsModalEl = document.getElementById('addFundsModal');
const addFundsModal = new bootstrap.Modal(addFundsModalEl);

addCreditButton.addEventListener('click', () => {
  addFundsModal.show();
});

addFundsModalEl.addEventListener('click', async (e) => {
  if (e.target.matches('button[data-amount]')) {
    const amount = parseInt(e.target.getAttribute('data-amount'));
    const start = userCredit;
    const end = userCredit + amount;
    const duration = Math.min(2000, 400 + (end - start) * 10);
    const frameRate = 30; // smoother animation without lag

    let current = start;
    const increment = (end - start) / (duration / (1000 / frameRate));

    // Animate credit increase
    const interval = setInterval(() => {
      current += increment;
      if (current >= end) {
        current = end;
        clearInterval(interval);
      }
      creditDisplay.textContent = Math.floor(current);
      modalCreditDisplay.textContent = Math.floor(current);
    }, 1000 / frameRate);

    // Save + feedback
    userCredit = end;
    let res = await fetch("/api/user/balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ balance: amount })
    });
    let resj = await res.json();
    if (!res.ok) {
      console.log(resj)
    }
    console.log(resj)

    creditDisplay.classList.add('credit-animate');
    modalCreditDisplay.classList.add('credit-animate');

    setTimeout(() => {
      creditDisplay.classList.remove('credit-animate');
      addFundsModal.hide();
    }, duration + 200);
  }
});

// --- Avatar modal logic ---
// Track temporary selection in modal
avatarInputs.forEach(input => {
  input.addEventListener('change', () => {
    tempSelectedAvatar = input.value; // store selection temporarily
  });
});

// Save button updates avatar preview and localStorage
saveAvatarBtn.addEventListener('click', async () => {
  // Save selection
  //localStorage.setItem('avatar', tempSelectedAvatar);


  await saveProfileInfo(undefined, tempSelectedAvatar);
  // Update preview
  avatarPreview.innerHTML = `<img src="${tempSelectedAvatar}" alt="Selected Avatar">`;
  avatarPreview.classList.add('saved');
  setTimeout(() => avatarPreview.classList.remove('saved'), 1000);

  // Close modal
  avatarModal.hide();
});
