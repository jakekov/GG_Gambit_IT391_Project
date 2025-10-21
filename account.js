// --- Elements ---
const avatarInputs = document.querySelectorAll('input[name="avatar"]');
const avatarPreview = document.getElementById('avatarPreview');
const usernameInput = document.getElementById('username');
const usernamePreview = document.getElementById('usernamePreview');
const resetButton = document.getElementById('resetProfile');
const form = document.getElementById('profileForm');
const creditDisplay = document.getElementById('userCredit');
const addCreditButton = document.getElementById('addCredit');
const withdrawButton = document.getElementById('withdrawFunds');
const saveAvatarBtn = document.getElementById('saveAvatarBtn');

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

// --- State ---
let userCredit = 0;
let tempSelectedAvatar = localStorage.getItem('avatar') || defaultAvatar;

// --- Initialize Bootstrap modal ---
const modalEl = document.getElementById('avatarModal');
const avatarModal = new bootstrap.Modal(modalEl);

// --- Initialize page ---
window.addEventListener('DOMContentLoaded', () => {
  const savedUsername = localStorage.getItem('username');
  const savedAvatar = localStorage.getItem('avatar');
  const savedCredit = localStorage.getItem('credit');

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
usernameInput.addEventListener('input', () => {
  const value = usernameInput.value.trim();
  usernamePreview.textContent = value || "No Username";
  localStorage.setItem('username', value);
});

// --- Profile form submit ---
form.addEventListener('submit', e => {
  e.preventDefault();
  alert("Profile saved successfully!");
});

// --- Reset profile ---
resetButton.addEventListener('click', () => {
  if (confirm("Are you sure you want to reset your profile?")) {
    localStorage.clear();
    usernameInput.value = "";
    usernamePreview.textContent = "No Username";
    avatarPreview.innerHTML = `<img src="${defaultAvatar}" alt="Default Avatar">`;
    avatarInputs.forEach(input => input.checked = false);
    creditDisplay.textContent = "0";
    userCredit = 0;
    tempSelectedAvatar = defaultAvatar;
  }
});

// --- Credits management ---
addCreditButton.addEventListener('click', () => {
  const amount = prompt("Enter amount to add:");
  if (amount && !isNaN(amount)) {
    userCredit += parseInt(amount);
    localStorage.setItem('credit', userCredit);
    creditDisplay.textContent = userCredit;
  }
});

withdrawButton.addEventListener('click', () => {
  const amount = prompt("Enter amount to withdraw:");
  if (amount && !isNaN(amount)) {
    const val = parseInt(amount);
    if (val <= userCredit) {
      userCredit -= val;
      localStorage.setItem('credit', userCredit);
      creditDisplay.textContent = userCredit;
    } else {
      alert("Insufficient balance!");
    }
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
saveAvatarBtn.addEventListener('click', () => {
  // Save selection
  localStorage.setItem('avatar', tempSelectedAvatar);

  // Update preview
  avatarPreview.innerHTML = `<img src="${tempSelectedAvatar}" alt="Selected Avatar">`;
  avatarPreview.classList.add('saved');
  setTimeout(() => avatarPreview.classList.remove('saved'), 1000);

  // Close modal
  avatarModal.hide();
});
