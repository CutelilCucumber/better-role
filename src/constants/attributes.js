import { Sword, Wind, HeartPulse, Brain, Eye, MessageCircle } from "lucide-react";

export const ATTRS = [
  { key: "wisdom", label: "Wisdom", color: "#a855f7", icon: Eye, angle: -90 },
  { key: "charisma", label: "Charisma", color: "#eab308", icon: MessageCircle, angle: -30 },
  { key: "strength", label: "Strength", color: "#ef4444", icon: Sword, angle: 30 },
  { key: "constitution", label: "Constitution", color: "#f97316", icon: HeartPulse, angle: 90 },
  { key: "dexterity", label: "Dexterity", color: "#22c55e", icon: Wind, angle: 150 },
  { key: "intelligence", label: "Intelligence", color: "#3b82f6", icon: Brain, angle: 210 },
];

export const ATTR_MAP = Object.fromEntries(ATTRS.map((a) => [a.key, a]));

export const EMPTY_STATE = {
  version: 1,
  user: { name: "Adventurer" },
  attributes: {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
  },
  activities: [],
  sessions: [],
};
