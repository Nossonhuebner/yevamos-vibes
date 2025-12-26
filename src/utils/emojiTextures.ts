import * as THREE from 'three';

// Cache for emoji textures to avoid re-rendering
const textureCache = new Map<string, THREE.Texture>();

// Font loading state
let fontLoaded = false;
let fontLoadPromise: Promise<void> | null = null;

// Noto Color Emoji font URL (Google Fonts)
const NOTO_COLOR_EMOJI_URL = 'https://fonts.gstatic.com/s/notocoloremoji/v30/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabsE4tq3luCC7p-aXxcn.ttf';

/**
 * Load the Noto Color Emoji font
 */
async function loadEmojiFont(): Promise<void> {
  if (fontLoaded) return;

  if (fontLoadPromise) {
    return fontLoadPromise;
  }

  fontLoadPromise = new Promise((resolve) => {
    const font = new FontFace('Noto Color Emoji', `url(${NOTO_COLOR_EMOJI_URL})`);

    font.load()
      .then((loadedFont) => {
        document.fonts.add(loadedFont);
        fontLoaded = true;
        resolve();
      })
      .catch((err) => {
        console.warn('Failed to load Noto Color Emoji, falling back to system emoji:', err);
        fontLoaded = true; // Mark as loaded to prevent retries, will use system fallback
        resolve();
      });
  });

  return fontLoadPromise;
}

/**
 * Create a texture from an emoji character
 */
function createEmojiTexture(emoji: string, size: number = 128): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d')!;

  // Clear canvas with transparency
  ctx.clearRect(0, 0, size, size);

  // Draw emoji centered
  ctx.font = `${size * 0.8}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.05); // Slight vertical adjustment

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  return texture;
}

/**
 * Get or create a cached emoji texture
 */
export async function getEmojiTexture(emoji: string): Promise<THREE.Texture> {
  // Ensure font is loaded
  await loadEmojiFont();

  // Check cache
  if (textureCache.has(emoji)) {
    return textureCache.get(emoji)!;
  }

  // Create and cache texture
  const texture = createEmojiTexture(emoji);
  textureCache.set(emoji, texture);

  return texture;
}

/**
 * Synchronously get a cached texture (returns undefined if not yet created)
 * Use this in render loops after initial async load
 */
export function getCachedEmojiTexture(emoji: string): THREE.Texture | undefined {
  return textureCache.get(emoji);
}

/**
 * Preload common emoji textures
 */
export async function preloadEmojiTextures(): Promise<void> {
  const emojis = ['👨', '👩', '👴', '👵', '👦', '👧'];
  await Promise.all(emojis.map(emoji => getEmojiTexture(emoji)));
}

// Male and female emoji options
export const MALE_EMOJIS = ['👨', '👴', '👦'];
export const FEMALE_EMOJIS = ['👩', '👵', '👧'];

/**
 * Get a consistent emoji for a person based on their ID
 */
export function getPersonEmojiChar(personId: string, gender: 'male' | 'female'): string {
  const hash = Math.abs(
    [...personId].reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0)
  );
  const emojis = gender === 'male' ? MALE_EMOJIS : FEMALE_EMOJIS;
  return emojis[hash % emojis.length];
}
