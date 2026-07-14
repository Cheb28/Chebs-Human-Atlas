export const SKILL_KEYS = ['academic', 'vocational', 'business', 'political'];

// Skills are uncapped experience totals. Every 10 XP produces one practical level.
// Keeping XP numeric also lets older saves migrate without losing their progress.
export function skillLevel(value) {
  return Math.max(0, Math.floor((Number(value) || 0) / 10));
}

export function addSkillXp(ch, key, amount) {
  ch.skills[key] = Math.max(0, (Number(ch.skills[key]) || 0) + amount);
  return skillLevel(ch.skills[key]);
}

export function hasSkillLevel(ch, key, level) {
  return skillLevel(ch.skills?.[key]) >= level;
}

export function skillLabel(value) {
  const xp = Math.max(0, Math.round(Number(value) || 0));
  return `Level ${skillLevel(xp)} · ${xp} XP`;
}
