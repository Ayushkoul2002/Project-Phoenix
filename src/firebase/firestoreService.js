// ============================================
// PROJECT PHOENIX — Firestore Service
// ============================================
// All Firestore CRUD and real-time listener
// functions. Data is stored hierarchically
// under: users/{uid}/...
// ============================================

import {
  collection,
  addDoc,
  setDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, useMock } from './config';

// ─── Helpers ────────────────────────────────

/**
 * Get start-of-day and start-of-next-day for a given date.
 * @param {Date} date - The target date
 */
const getDateRange = (date) => {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  if (useMock) {
    return { start: startOfDay, end: endOfDay };
  }
  return {
    start: Timestamp.fromDate(startOfDay),
    end: Timestamp.fromDate(endOfDay),
  };
};

// ─── Mock Firestore Implementation ──────────

const mockListeners = {
  foodLogs: new Set(),
  weightLogs: new Set(),
  customFoods: new Set(),
};

const getMockData = (key, defaultValue = []) => {
  try {
    return JSON.parse(localStorage.getItem(`phoenix_mock_${key}`)) || defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveMockData = (key, data) => {
  localStorage.setItem(`phoenix_mock_${key}`, JSON.stringify(data));
};

const notifyListeners = (collectionName) => {
  mockListeners[collectionName].forEach((cb) => cb());
};

// ─── Food Logs ──────────────────────────────
// Collection: users/{uid}/foodLogs

/**
 * Add a food log entry for a specific date.
 * If no logDate is provided, defaults to now.
 */
export const addFoodLog = async (uid, { foodName, calories, protein, logDate }) => {
  if (useMock) {
    const key = `foodLogs_${uid}`;
    const logs = getMockData(key);
    const newLog = {
      id: 'mock_food_' + Math.random().toString(36).substr(2, 9),
      foodName,
      calories: Number(calories),
      protein: Number(protein),
      timestamp: (logDate || new Date()).toISOString(),
    };
    logs.push(newLog);
    saveMockData(key, logs);
    notifyListeners('foodLogs');
    return newLog;
  }

  const ref = collection(db, 'users', uid, 'foodLogs');
  return addDoc(ref, {
    foodName,
    calories: Number(calories),
    protein: Number(protein),
    timestamp: logDate ? Timestamp.fromDate(logDate) : serverTimestamp(),
  });
};

/**
 * Delete a food log entry.
 */
export const deleteFoodLog = async (uid, docId) => {
  if (useMock) {
    const key = `foodLogs_${uid}`;
    const logs = getMockData(key);
    const updated = logs.filter((log) => log.id !== docId);
    saveMockData(key, updated);
    notifyListeners('foodLogs');
    return;
  }

  const ref = doc(db, 'users', uid, 'foodLogs', docId);
  return deleteDoc(ref);
};

/**
 * Subscribe to food logs for a specific date in real-time.
 * Returns an unsubscribe function.
 */
export const subscribeDateFoodLogs = (uid, date, callback) => {
  if (useMock) {
    const key = `foodLogs_${uid}`;
    const { start, end } = getDateRange(date);
    const handler = () => {
      const logs = getMockData(key);
      const dayLogs = logs
        .filter((log) => {
          const logDate = new Date(log.timestamp);
          return logDate >= start && logDate < end;
        })
        .map((log) => ({
          ...log,
          timestamp: { toDate: () => new Date(log.timestamp) },
        }));
      callback(dayLogs);
    };

    mockListeners.foodLogs.add(handler);
    handler();
    return () => mockListeners.foodLogs.delete(handler);
  }

  const { start, end } = getDateRange(date);
  const ref = collection(db, 'users', uid, 'foodLogs');
  const q = query(
    ref,
    where('timestamp', '>=', start),
    where('timestamp', '<', end),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(logs);
  });
};

/**
 * Subscribe to ALL food logs (for overall stats).
 * Returns an unsubscribe function.
 */
export const subscribeAllFoodLogs = (uid, callback) => {
  if (useMock) {
    const key = `foodLogs_${uid}`;
    const handler = () => {
      const logs = getMockData(key).map((log) => ({
        ...log,
        timestamp: { toDate: () => new Date(log.timestamp) },
      }));
      callback(logs);
    };
    mockListeners.foodLogs.add(handler);
    handler();
    return () => mockListeners.foodLogs.delete(handler);
  }

  const ref = collection(db, 'users', uid, 'foodLogs');
  const q = query(ref, orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(logs);
  });
};

// ─── Weight Logs ────────────────────────────
// Collection: users/{uid}/weightLogs

/**
 * Add a weight log entry.
 */
export const addWeightLog = async (uid, weight) => {
  if (useMock) {
    const key = `weightLogs_${uid}`;
    const logs = getMockData(key);
    const newLog = {
      id: 'mock_weight_' + Math.random().toString(36).substr(2, 9),
      weight: Number(weight),
      timestamp: new Date().toISOString(),
    };
    logs.push(newLog);
    saveMockData(key, logs);
    notifyListeners('weightLogs');
    return newLog;
  }

  const ref = collection(db, 'users', uid, 'weightLogs');
  return addDoc(ref, {
    weight: Number(weight),
    timestamp: serverTimestamp(),
  });
};

/**
 * Delete a weight log entry.
 */
export const deleteWeightLog = async (uid, docId) => {
  if (useMock) {
    const key = `weightLogs_${uid}`;
    const logs = getMockData(key);
    const updated = logs.filter((log) => log.id !== docId);
    saveMockData(key, updated);
    notifyListeners('weightLogs');
    return;
  }

  const ref = doc(db, 'users', uid, 'weightLogs', docId);
  return deleteDoc(ref);
};

/**
 * Subscribe to all weight logs ordered by timestamp.
 * Returns an unsubscribe function.
 */
export const subscribeWeightLogs = (uid, callback) => {
  if (useMock) {
    const key = `weightLogs_${uid}`;
    const handler = () => {
      const logs = getMockData(key).map((log) => ({
        ...log,
        timestamp: { toDate: () => new Date(log.timestamp) },
      }));
      callback(logs);
    };

    mockListeners.weightLogs.add(handler);
    handler();
    return () => mockListeners.weightLogs.delete(handler);
  }

  const ref = collection(db, 'users', uid, 'weightLogs');
  const q = query(ref, orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(logs);
  });
};

// ─── Custom Foods ───────────────────────────
// Collection: users/{uid}/customFoods

/**
 * Add a custom food to the user's personal dictionary.
 */
export const addCustomFood = async (uid, { name, calories, protein }) => {
  if (useMock) {
    const key = `customFoods_${uid}`;
    const foods = getMockData(key);
    const newFood = {
      id: 'mock_custom_' + Math.random().toString(36).substr(2, 9),
      name,
      calories: Number(calories),
      protein: Number(protein),
    };
    foods.push(newFood);
    saveMockData(key, foods);
    notifyListeners('customFoods');
    return newFood;
  }

  const ref = collection(db, 'users', uid, 'customFoods');
  return addDoc(ref, {
    name,
    calories: Number(calories),
    protein: Number(protein),
  });
};

/**
 * Delete a custom food from the user's dictionary.
 */
export const deleteCustomFood = async (uid, docId) => {
  if (useMock) {
    const key = `customFoods_${uid}`;
    const foods = getMockData(key);
    const updated = foods.filter((food) => food.id !== docId);
    saveMockData(key, updated);
    notifyListeners('customFoods');
    return;
  }

  const ref = doc(db, 'users', uid, 'customFoods', docId);
  return deleteDoc(ref);
};

/**
 * Subscribe to the user's custom foods in real-time.
 * Returns an unsubscribe function.
 */
export const subscribeCustomFoods = (uid, callback) => {
  if (useMock) {
    const key = `customFoods_${uid}`;
    const handler = () => {
      const foods = getMockData(key);
      callback(foods);
    };

    mockListeners.customFoods.add(handler);
    handler();
    return () => mockListeners.customFoods.delete(handler);
  }

  const ref = collection(db, 'users', uid, 'customFoods');
  return onSnapshot(ref, (snapshot) => {
    const foods = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(foods);
  });
};

// ─── User Profile ─────────────────────────────
// Document: users/{uid}/profile/config

/**
 * Set/update the user's biological profile and calorie targets.
 */
export const updateUserProfile = async (uid, profileData) => {
  if (useMock) {
    const key = `profile_${uid}`;
    saveMockData(key, profileData);
    if (!mockListeners.profile) {
      mockListeners.profile = new Set();
    }
    mockListeners.profile.forEach((cb) => cb());
    return profileData;
  }

  const ref = doc(db, 'users', uid, 'profile', 'config');
  return setDoc(ref, {
    ...profileData,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

/**
 * Subscribe to the user's profile in real-time.
 */
export const subscribeUserProfile = (uid, callback) => {
  if (useMock) {
    const key = `profile_${uid}`;
    const handler = () => {
      const profile = getMockData(key, null);
      callback(profile);
    };
    if (!mockListeners.profile) {
      mockListeners.profile = new Set();
    }
    mockListeners.profile.add(handler);
    handler();
    return () => mockListeners.profile.delete(handler);
  }

  const ref = doc(db, 'users', uid, 'profile', 'config');
  return onSnapshot(ref, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback(null);
    }
  });
};
