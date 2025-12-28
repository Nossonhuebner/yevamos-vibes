/**
 * Halachic Status Categories
 *
 * Defines the categories of halachic statuses with their visual styling.
 * These are the "buckets" that specific rules produce.
 */

import { StatusCategory, HalachicLevel } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Color Palette for Status Categories
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Colors for each halachic level (used as defaults).
 */
export const LEVEL_COLORS: Record<HalachicLevel, string> = {
  doraita: '#ef4444', // Red - most severe
  drabbanan: '#f97316', // Orange
  minhag: '#eab308', // Yellow
  chumra: '#8b5cf6', // Purple
  kula: '#22c55e', // Green - most lenient
};

// ═══════════════════════════════════════════════════════════════════════════
// Default Status Categories
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Standard status categories for the halachic system.
 * These can be extended or replaced with custom categories.
 */
export const DEFAULT_CATEGORIES: StatusCategory[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Ervah (Forbidden Relations) Categories
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'ervah-doraita',
    name: { en: 'Ervah (Torah)', he: 'ערווה דאורייתא' },
    level: 'doraita',
    color: '#dc2626', // Deep red
    priority: 100,
    description: {
      en: 'Torah-level forbidden relationship',
      he: 'איסור ערווה מן התורה',
    },
  },
  {
    id: 'ervah-drabbanan',
    name: { en: 'Ervah (Rabbinic)', he: 'ערווה דרבנן' },
    level: 'drabbanan',
    color: '#ea580c', // Orange-red
    priority: 90,
    description: {
      en: 'Rabbinically forbidden relationship',
      he: 'איסור ערווה מדרבנן',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Shniyot (Secondary Prohibitions)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'shniyah',
    name: { en: 'Shniyah', he: 'שניות' },
    level: 'drabbanan',
    color: '#f97316', // Orange
    priority: 80,
    description: {
      en: 'Secondary prohibition (Rabbinic extension)',
      he: 'שניות לעריות',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Yibum-Related Categories
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'zikah-active',
    name: { en: 'Zikah (Active)', he: 'זיקה' },
    level: 'doraita',
    color: '#7c3aed', // Purple
    priority: 85,
    description: {
      en: 'Active levirate bond awaiting resolution',
      he: 'זיקה הממתינה ליבום או חליצה',
    },
  },
  {
    id: 'zakuk-yibum',
    name: { en: 'Obligated in Yibum', he: 'זקוק ליבום' },
    level: 'doraita',
    color: '#a855f7', // Lighter purple
    priority: 75,
    description: {
      en: 'This yavam is obligated to perform yibum or chalitzah',
      he: 'היבם זקוק ליבם או לחלוץ',
    },
  },
  {
    id: 'tzaras-ervah',
    name: { en: 'Tzaras Ervah', he: 'צרת ערווה' },
    level: 'doraita',
    color: '#be123c', // Rose red
    priority: 95,
    description: {
      en: 'Co-wife of a forbidden relation (exempt from yibum)',
      he: 'צרת ערווה - פטורה מן היבום',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Kohen-Specific Categories
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'assur-lkohen',
    name: { en: 'Forbidden to Kohen', he: 'אסורה לכהן' },
    level: 'doraita',
    color: '#0891b2', // Cyan
    priority: 70,
    description: {
      en: 'Forbidden to marry a Kohen',
      he: 'אסורה להינשא לכהן',
    },
  },
  {
    id: 'assur-lkohen-gadol',
    name: { en: 'Forbidden to Kohen Gadol', he: 'אסורה לכהן גדול' },
    level: 'doraita',
    color: '#0e7490', // Darker cyan
    priority: 65,
    description: {
      en: 'Forbidden to marry a Kohen Gadol (additional restrictions)',
      he: 'אסורה לכהן גדול',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Permitted Categories
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'mutar',
    name: { en: 'Permitted', he: 'מותר' },
    level: 'kula',
    color: '#16a34a', // Green
    priority: 0,
    description: {
      en: 'No prohibition - marriage permitted',
      he: 'אין איסור - מותרת להינשא',
    },
  },
  {
    id: 'mutar-bshaah',
    name: { en: 'Permitted After Time', he: 'מותרת לאחר זמן' },
    level: 'kula',
    color: '#65a30d', // Lime green
    priority: 5,
    description: {
      en: 'Permitted after waiting period',
      he: 'מותרת לאחר תקופת המתנה',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Chumra/Minhag Categories
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'assur-minhag',
    name: { en: 'Forbidden by Custom', he: 'אסור ממנהג' },
    level: 'minhag',
    color: '#ca8a04', // Yellow/gold
    priority: 40,
    description: {
      en: 'Forbidden by established custom',
      he: 'אסור על פי מנהג',
    },
  },
  {
    id: 'chumra',
    name: { en: 'Stringency', he: 'חומרא' },
    level: 'chumra',
    color: '#7c3aed', // Purple
    priority: 30,
    description: {
      en: 'Additional stringency beyond the letter of the law',
      he: 'חומרא מעבר לעיקר הדין',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Special Status Categories
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'mamzer',
    name: { en: 'Mamzer', he: 'ממזר' },
    level: 'doraita',
    color: '#991b1b', // Dark red
    priority: 98,
    description: {
      en: 'Offspring of a forbidden union',
      he: 'נולד מאיסור ערווה',
    },
  },
  {
    id: 'safek-mamzer',
    name: { en: 'Doubtful Mamzer', he: 'ספק ממזר' },
    level: 'drabbanan',
    color: '#b91c1c', // Medium red
    priority: 88,
    description: {
      en: 'Doubtful mamzer status',
      he: 'ספק ממזרות',
    },
  },
  {
    id: 'chalal',
    name: { en: 'Chalal', he: 'חלל' },
    level: 'doraita',
    color: '#059669', // Teal
    priority: 50,
    description: {
      en: 'Disqualified from Kehunah',
      he: 'פסול מכהונה',
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Category Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a category by ID.
 */
export function getCategoryById(
  id: string,
  categories: StatusCategory[] = DEFAULT_CATEGORIES
): StatusCategory | undefined {
  return categories.find((c) => c.id === id);
}

/**
 * Get all categories at a specific level.
 */
export function getCategoriesByLevel(
  level: HalachicLevel,
  categories: StatusCategory[] = DEFAULT_CATEGORIES
): StatusCategory[] {
  return categories.filter((c) => c.level === level);
}

/**
 * Sort categories by priority (highest first).
 */
export function sortCategoriesByPriority(
  categories: StatusCategory[]
): StatusCategory[] {
  return [...categories].sort((a, b) => b.priority - a.priority);
}

/**
 * Get the most severe category from a list.
 */
export function getMostSevereCategory(
  categories: StatusCategory[]
): StatusCategory | undefined {
  if (categories.length === 0) return undefined;
  return sortCategoriesByPriority(categories)[0];
}

/**
 * Check if one category is more severe than another.
 */
export function isMoreSevere(a: StatusCategory, b: StatusCategory): boolean {
  return a.priority > b.priority;
}

// ═══════════════════════════════════════════════════════════════════════════
// Category Registry
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Registry for managing status categories.
 */
export class CategoryRegistry {
  private categories: Map<string, StatusCategory> = new Map();

  constructor(initialCategories: StatusCategory[] = DEFAULT_CATEGORIES) {
    for (const category of initialCategories) {
      this.categories.set(category.id, category);
    }
  }

  /**
   * Add a new category.
   */
  add(category: StatusCategory): void {
    this.categories.set(category.id, category);
  }

  /**
   * Get a category by ID.
   */
  get(id: string): StatusCategory | undefined {
    return this.categories.get(id);
  }

  /**
   * Get all categories.
   */
  getAll(): StatusCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get categories sorted by priority.
   */
  getAllSorted(): StatusCategory[] {
    return sortCategoriesByPriority(this.getAll());
  }

  /**
   * Check if a category exists.
   */
  has(id: string): boolean {
    return this.categories.has(id);
  }

  /**
   * Remove a category.
   */
  remove(id: string): boolean {
    return this.categories.delete(id);
  }

  /**
   * Clear all categories.
   */
  clear(): void {
    this.categories.clear();
  }
}
