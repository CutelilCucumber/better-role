import { CLASS_WEIGHTS } from "../constants/archetypes";

export const uid = (p) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function activityStats(activity, sessions) {
  const own = sessions.filter((s) => s.activityId === activity.id);
  const totalDuration = own.reduce((sum, s) => sum + (s.duration || 0), 0);
  const avgIntensity = own.length
    ? own.reduce((sum, s) => sum + (s.intensity || 0), 0) / own.length
    : 0;
  const bestQuantity = own.reduce((m, s) => Math.max(m, s.quantity || 0), 0);
  const bestDuration = own.reduce((m, s) => Math.max(m, s.duration || 0), 0);
  const lastSession = own.length
    ? own.reduce((a, b) => (a.date > b.date ? a : b))
    : null;
  return {
    sessionCount: own.length,
    totalDuration,
    avgIntensity,
    bestQuantity,
    bestDuration,
    lastSession,
    sessions: own.slice().sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export function computeArchetype(attributes) {
  let best = null;
  let bestScore = -Infinity;
  for (const [cls, weights] of Object.entries(CLASS_WEIGHTS)) {
    let score = 0;
    for (const [attr, w] of Object.entries(weights)) {
      score += (attributes[attr] || 0) * w;
    }
    if (score > bestScore) {
      bestScore = score;
      best = cls;
    }
  }
  return best || "Adventurer";
}

export function nodeRadius(sessionCount) {
  return Math.min(14 + sessionCount * 2.5, 34);
}
