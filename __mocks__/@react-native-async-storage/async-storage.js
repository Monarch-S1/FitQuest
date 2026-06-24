/**
 * Manual mock for @react-native-async-storage/async-storage
 * Provides a simple in-memory storage implementation for tests.
 * Avoids importing native modules in Jest.
 */
/* global jest */

const store = {};

const AsyncStorage = {
  getItem: jest.fn(async (key) => store[key] ?? null),
  setItem: jest.fn(async (key, value) => {
    store[key] = String(value);
  }),
  removeItem: jest.fn(async (key) => {
    delete store[key];
  }),
  clear: jest.fn(async () => {
    Object.keys(store).forEach((key) => delete store[key]);
  }),
  getAllKeys: jest.fn(async () => Object.keys(store)),
  multiGet: jest.fn(async (keys) => keys.map((key) => [key, store[key] ?? null])),
  multiSet: jest.fn(async (kvPairs) => {
    kvPairs.forEach(([key, value]) => {
      store[key] = String(value);
    });
  }),
  multiRemove: jest.fn(async (keys) => {
    keys.forEach((key) => delete store[key]);
  }),
};

module.exports = AsyncStorage;
