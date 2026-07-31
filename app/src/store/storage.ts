import { StateStorage } from 'zustand/middleware';

function createFallbackStorage(): StateStorage {
  const store = new Map<string, string>();
  return {
    getItem: async (name) => store.get(name) ?? null,
    setItem: async (name, value) => { store.set(name, value); },
    removeItem: async (name) => { store.delete(name); },
  };
}

let storageInstance: StateStorage | null = null;

export function getStorage(): StateStorage {
  if (storageInstance) return storageInstance;

  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      storageInstance = {
        getItem: AsyncStorage.getItem.bind(AsyncStorage),
        setItem: AsyncStorage.setItem.bind(AsyncStorage),
        removeItem: AsyncStorage.removeItem.bind(AsyncStorage),
      };
    }
  } catch (_) {}

  if (!storageInstance) {
    console.warn('[Store] AsyncStorage unavailable, using in-memory fallback');
    storageInstance = createFallbackStorage();
  }

  return storageInstance;
}
