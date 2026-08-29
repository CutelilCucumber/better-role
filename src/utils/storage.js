const STORAGE_KEY = "rolebetter-state";

export async function loadState() {
  try {
    const res = await window.storage.get(STORAGE_KEY, false);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {
    // no saved state yet, or storage unavailable
  }
  return null;
}

export async function saveState(state) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(state), false);
  } catch (e) {
    console.error("save failed", e);
  }
}
