/**
 * auth.js — Authentication logic for login and registration pages
 */

async function handleLogin(e) {
  e.preventDefault();
  hideAlert('loginError');
  hideAlert('loginSuccess');

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');

  if (!email || !password) {
    showAlert('loginError', 'Please enter your email and password.', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const result = await window.OfferShieldAPI.auth.login(email, password);
    if (result.success) {
      window.OfferShieldAPI.setAuth(result.token, result.user);
      showAlert('loginSuccess', `Welcome back, ${result.user.name}! Redirecting...`, 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
    }
  } catch (err) {
    showAlert('loginError', err.message || 'Login failed. Please check your credentials.', 'error');
    btn.disabled = false;
    btn.textContent = 'Log In';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  hideAlert('registerError');
  hideAlert('registerSuccess');

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const btn = document.getElementById('registerBtn');

  if (!name || !email || !password) {
    showAlert('registerError', 'Please fill in all fields.', 'error');
    return;
  }
  if (password.length < 6) {
    showAlert('registerError', 'Password must be at least 6 characters.', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    const result = await window.OfferShieldAPI.auth.register(name, email, password);
    if (result.success) {
      window.OfferShieldAPI.setAuth(result.token, result.user);
      showAlert('registerSuccess', 'Account created successfully! Redirecting to dashboard...', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
    }
  } catch (err) {
    showAlert('registerError', err.message || 'Registration failed. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

// Redirect if already logged in
document.addEventListener('DOMContentLoaded', () => {
  const user = window.OfferShieldAPI ? window.OfferShieldAPI.getUser() : null;
  if (user && (window.location.pathname.includes('login') || window.location.pathname.includes('register'))) {
    window.location.href = 'dashboard.html';
  }
});
