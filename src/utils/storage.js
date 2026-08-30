const STORAGE_KEY = "rolebetter-state";

const useNativeStorage = typeof window !== "undefined" && window.storage;

export async function loadState() {
  try {
    if (useNativeStorage) {
      const res = await window.storage.get(STORAGE_KEY, false);
      if (res && res.value) return JSON.parse(res.value);
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    }
  } catch (e) {
    // no saved state yet, or storage unavailable
  }
  return null;
}

export async function saveState(state) {
  try {
    if (useNativeStorage) {
      await window.storage.set(STORAGE_KEY, JSON.stringify(state), false);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    console.error("save failed", e);
  }
}