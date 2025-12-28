/**
 * Halacha Module Index
 *
 * Re-exports all halachic types, utilities, and components.
 */

// Types
export * from './types';

// Categories
export * from './categories';

// Pattern Matcher
export { PatternMatcher, createPatternMatcher, patternMatches } from './patternMatcher';
export type { PatternMatchResult } from './patternMatcher';

// Zikah Tracker
export { ZikahTracker, createZikahTracker, hasZikah } from './zikahTracker';

// Status Engine
export {
  StatusEngine,
  createStatusEngine,
  createEmptyStatusEngine,
  createDefaultOpinionProfile,
} from './statusEngine';
