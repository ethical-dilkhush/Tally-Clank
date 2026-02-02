/**
 * Browser stub for @react-native-async-storage/async-storage.
 * Used by @metamask/sdk in web builds; React Native package is not installed.
 */
const storage = new Map();

export default {
  getItem: async (key) => (storage.get(key) ?? null),
  setItem: async (key, value) => {
    storage.set(key, String(value));
  },
  removeItem: async (key) => {
    storage.delete(key);
  },
  clear: async () => {
    storage.clear();
  },
  getAllKeys: async () => Array.from(storage.keys()),
  multiGet: async (keys) => keys.map((key) => [key, storage.get(key) ?? null]),
  multiSet: async (pairs) => {
    for (const [key, value] of pairs) storage.set(key, String(value));
  },
  multiRemove: async (keys) => {
    for (const key of keys) storage.delete(key);
  },
};
