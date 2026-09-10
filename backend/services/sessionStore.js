/**
 * sessionStore.js — Shared in-memory store for verifications
 * Used when MongoDB is unavailable (demo/development mode).
 */

const sessionStore = new Map();

function getSessionStore() {
  return sessionStore;
}

module.exports = { sessionStore, getSessionStore };
