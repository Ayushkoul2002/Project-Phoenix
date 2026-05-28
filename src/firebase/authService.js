// ============================================
// PROJECT PHOENIX — Authentication Service
// ============================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, useMock } from './config';

// ─── Mock Auth Implementation ────────────────

const MOCK_USERS_KEY = 'phoenix_mock_users';
const MOCK_CURRENT_USER_KEY = 'phoenix_mock_current_user';
const mockListeners = new Set();

const getMockUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(MOCK_USERS_KEY)) || {};
  } catch {
    return {};
  }
};

const saveMockUsers = (users) => {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

const getMockCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem(MOCK_CURRENT_USER_KEY)) || null;
  } catch {
    return null;
  }
};

const setMockCurrentUser = (user) => {
  if (user) {
    localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(MOCK_CURRENT_USER_KEY);
  }
  // Notify listeners
  mockListeners.forEach((callback) => callback(user));
};

// ─── Exported Auth Service ───────────────────

/**
 * Sign in an existing agent (user) with email & password.
 */
export const loginUser = async (email, password) => {
  if (useMock) {
    // Simulate network delay
    await new Promise((res) => setTimeout(res, 800));
    const users = getMockUsers();
    const user = users[email.toLowerCase()];
    if (!user || user.password !== password) {
      throw { code: 'auth/invalid-credential', message: 'ACCESS DENIED' };
    }
    const authUser = { uid: user.uid, email: user.email, isMock: true };
    setMockCurrentUser(authUser);
    return { user: authUser };
  }
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Create a new agent (user) with email & password.
 */
export const signupUser = async (email, password) => {
  if (useMock) {
    await new Promise((res) => setTimeout(res, 1000));
    if (password.length < 6) {
      throw { code: 'auth/weak-password', message: 'WEAK CIPHER' };
    }
    const users = getMockUsers();
    const cleanEmail = email.toLowerCase();
    if (users[cleanEmail]) {
      throw { code: 'auth/email-already-in-use', message: 'AGENT EXISTS' };
    }
    const uid = 'mock_uid_' + Math.random().toString(36).substr(2, 9);
    users[cleanEmail] = { uid, email, password };
    saveMockUsers(users);

    const authUser = { uid, email, isMock: true };
    setMockCurrentUser(authUser);
    return { user: authUser };
  }
  return createUserWithEmailAndPassword(auth, email, password);
};

/**
 * Log out the current agent.
 */
export const logoutUser = async () => {
  if (useMock) {
    await new Promise((res) => setTimeout(res, 500));
    setMockCurrentUser(null);
    return;
  }
  return signOut(auth);
};

/**
 * Subscribe to authentication state changes.
 * Returns an unsubscribe function.
 */
export const onAuthChange = (callback) => {
  if (useMock) {
    mockListeners.add(callback);
    // Trigger initial status callback
    const currentUser = getMockCurrentUser();
    callback(currentUser);
    return () => {
      mockListeners.delete(callback);
    };
  }
  return onAuthStateChanged(auth, callback);
};
