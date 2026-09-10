/**
 * api.js — REST API client for OfferShield AI
 * Handles all communication with the backend.
 */

const API_BASE = (() => {
  // Auto-detect backend URL
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `http://${window.location.hostname}:5000/api`;
  }
  return '/api';
})();

const SESSION_ID_KEY = 'offershield_session_id';
const TOKEN_KEY = 'offershield_token';
const USER_KEY = 'offershield_user';

// Generate or retrieve session ID for anonymous users
function getSessionId() {
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch (_) {
    return null;
  }
}

function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function buildHeaders(extra = {}) {
  const headers = {
    'x-session-id': getSessionId(),
    'X-Session-ID': getSessionId(),
    ...extra,
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function apiRequest(method, endpoint, data = null, isFormData = false) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: buildHeaders(isFormData ? {} : { 'Content-Type': 'application/json' }),
  };
  if (data) {
    options.body = isFormData ? data : JSON.stringify(data);
  }
  try {
    const res = await fetch(url, options);
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || `Request failed (${res.status})`);
    }
    return json;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Cannot connect to the OfferShield AI server. Please ensure the backend is running on port 5000.');
    }
    throw err;
  }
}

// Auth API
const authApi = {
  register: (name, email, password) =>
    apiRequest('POST', '/auth/register', { name, email, password }),
  login: (email, password) =>
    apiRequest('POST', '/auth/login', { email, password }),
  getProfile: () =>
    apiRequest('GET', '/auth/profile'),
};

// Verification API
const verifyApi = {
  verifyText: (text) =>
    apiRequest('POST', '/verify/text', { text }),
  verifyUrl: (url, context) =>
    apiRequest('POST', '/verify/url', { url, text: context }),
  verifyDemo: (demoType) =>
    apiRequest('POST', '/verify/demo', { demoType }),
  verifyFile: (formData) =>
    apiRequest('POST', '/verify/upload', formData, true),
};

// Verifications API
const verificationsApi = {
  getAll: () =>
    apiRequest('GET', '/verifications'),
  getById: (id) =>
    apiRequest('GET', `/verifications/${id}`),
  delete: (id) =>
    apiRequest('DELETE', `/verifications/${id}`),
};

// Dashboard API
const dashboardApi = {
  getStats: () =>
    apiRequest('GET', '/dashboard/stats'),
};

window.OfferShieldAPI = {
  auth: authApi,
  verify: verifyApi,
  verifications: verificationsApi,
  dashboard: dashboardApi,
  getUser,
  getToken,
  setAuth,
  clearAuth,
  getSessionId,
};
