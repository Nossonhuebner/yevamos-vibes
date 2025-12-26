// Simple single-codepoint emojis that render reliably in Three.js/WebGL
// Avoid ZWJ composite emojis (profession variants, skin tones) as they don't render properly
export const MALE_EMOJIS = ['👨', '👴', '👦'];
export const FEMALE_EMOJIS = ['👩', '👵', '👧'];

/**
 * Get a consistent emoji for a person based on their ID.
 * Uses a hash of the person ID to select from the emoji array,
 * so the same person always gets the same emoji.
 * Note: Deceased status is handled by graying out the node, not changing the emoji.
 */
export function getPersonEmoji(
  personId: string,
  gender: 'male' | 'female',
  _isDead: boolean
): string {
  // Simple hash function to get a consistent index from the ID
  const hash = Math.abs(
    [...personId].reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0)
  );

  const emojis = gender === 'male' ? MALE_EMOJIS : FEMALE_EMOJIS;
  return emojis[hash % emojis.length];
}
