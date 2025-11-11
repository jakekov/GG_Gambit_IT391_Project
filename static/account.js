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
let tempSelectedAvatar = localStorage.getItem('avatar') || defaultAvatar;

// --- Initialize Bootstrap modal ---
const modalEl = document.getElementById('avatarModal');
const avatarModal = new bootstrap.Modal(modalEl);

// --- Initialize page ---
window.addEventListener('DOMContentLoaded', () => {
  const savedUsername = localStorage.getItem('username');
  const savedAvatar = localStorage.getItem('avatar');
  const savedCredit = localStorage.getItem('credit');
  const savedEmail = localStorage.getItem('email');

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
  localStorage.setItem('email', userEmail);
});

// --- Profile form submit ---
form.addEventListener('submit', e => {
  e.preventDefault();
  alert("Profile saved successfully!");
});


// Show the confirmation modal only
document.getElementById("resetProfile").addEventListener("click", function() {
  const deleteModal = new bootstrap.Modal(document.getElementById("deleteAccountModal"));
  deleteModal.show();
});

// When the user confirms deletion
document.getElementById("confirmDeleteBtn").addEventListener("click", function() {
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

addFundsModalEl.addEventListener('click', (e) => {
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
    localStorage.setItem('credit', userCredit);
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
