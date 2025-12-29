/**
 * Halachic Layer Type Definitions
 *
 * Core types for the halachic status computation system.
 * This is a PLATFORM - specific rules and opinions are data, not hardcoded.
 */

import { RelationshipType } from '@/types';
import { EventRef, RelationshipPath } from '@/utils/graphQueries';

// ═══════════════════════════════════════════════════════════════════════════
// Status Categories
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Level of halachic obligation/prohibition.
 */
export type HalachicLevel = 'doraita' | 'drabbanan' | 'minhag' | 'chumra' | 'kula';

/**
 * A category of halachic status (e.g., "Ervah", "Shniyah", "Mutar").
 */
export interface StatusCategory {
  id: string;
  name: { en: string; he: string };
  level: HalachicLevel;
  color: string; // For UI display
  priority: number; // Higher = more severe, shown first
  description?: { en: string; he: string };
}

// ═══════════════════════════════════════════════════════════════════════════
// Pattern Matching System
// ═══════════════════════════════════════════════════════════════════════════

/**
 * State condition for checking person state at a slice.
 */
export interface StateCondition {
  person: 'A' | 'B'; // Which person in the pair
  condition:
    | 'alive'
    | 'dead'
    | 'married'
    | 'unmarried'
    | 'has-children'
    | 'childless'
    | 'has-living-children'
    | 'has-brothers'
    | 'is-kohen'
    | 'is-levi'
    | 'is-yisrael';
  negate?: boolean;
}

/**
 * Temporal condition for event-relative queries.
 */
export interface TemporalCondition {
  type:
    | 'alive-when'
    | 'lifetime-overlap'
    | 'event-order'
    | 'had-children-when'
    | 'relationship-existed-when';

  /**
   * For 'alive-when' and 'had-children-when': Who we're checking.
   */
  subject?: 'A' | 'B' | 'spouse-of-A' | 'spouse-of-B' | 'child-of-A' | 'child-of-B';

  /**
   * The event to check against.
   */
  event?: {
    type: 'death' | 'marriage' | 'divorce' | 'birth' | 'yibum' | 'chalitzah';
    of: 'A' | 'B' | 'spouse-of-A' | 'spouse-of-B';
  };

  /**
   * For 'lifetime-overlap': Check overlap with whom.
   */
  overlapWith?: 'A' | 'B' | 'spouse-of-A' | 'spouse-of-B';

  /**
   * For 'event-order': First event in comparison.
   */
  firstEvent?: {
    type: 'death' | 'marriage' | 'divorce' | 'birth';
    of: 'A' | 'B' | 'child-of-A' | 'spouse-of-A';
  };

  /**
   * For 'event-order': Second event in comparison.
   */
  secondEvent?: {
    type: 'death' | 'marriage' | 'divorce' | 'birth';
    of: 'A' | 'B' | 'child-of-A' | 'spouse-of-A';
  };

  /**
   * For 'relationship-existed-when': The relationship to check.
   */
  relationship?: {
    between: ['A', 'B'] | ['A', 'spouse-of-B'] | ['B', 'spouse-of-A'];
    type: RelationshipType;
  };

  /**
   * Negate the condition.
   */
  negate?: boolean;
}

/**
 * Pattern for matching relationship configurations.
 */
export interface RelationshipPattern {
  type: 'direct' | 'path' | 'state' | 'temporal' | 'composite';

  /**
   * For 'direct': Check specific edge types between A and B.
   */
  directEdgeTypes?: RelationshipType[];

  /**
   * For 'path': Check derived relationship path.
   * Uses dot notation: "spouse.sibling" = sibling of spouse
   * Path is from A to B.
   */
  pathPattern?: string;

  /**
   * For 'state': Check person state conditions.
   */
  stateConditions?: StateCondition[];

  /**
   * For 'temporal': Check conditions relative to specific events.
   */
  temporalConditions?: TemporalCondition[];

  /**
   * For 'composite': Combine multiple patterns with AND/OR logic.
   */
  compositeOp?: 'and' | 'or';
  subPatterns?: RelationshipPattern[];

  /**
   * Optional: Only match if path goes through specific gender.
   * Applies to ALL steps in the path (legacy behavior).
   */
  throughGender?: 'male' | 'female';

  /**
   * Optional: Gender filter for each step in the path.
   * Array length should match pathPattern steps.
   * Use null for "any gender" at that step.
   * Takes precedence over throughGender if both are specified.
   */
  pathGenders?: (('male' | 'female') | null)[];

  /**
   * Optional: Negate the result of this pattern.
   * If true, the pattern matches when it would NOT normally match.
   */
  negate?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Machlokas (Dispute) System
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Level of authorities in the machlokas.
 */
export type MachlokasLevel = 'tanaim' | 'amoraim' | 'rishonim' | 'achronim';

/**
 * An opinion in a machlokas.
 */
export interface Opinion {
  id: string;
  holders: string[]; // Who holds this opinion: ["ר' מאיר", "ר' יהודה"]
  position: { en: string; he: string };
  sources?: string[]; // Gemara references
}

/**
 * A machlokas (halachic dispute).
 */
export interface Machlokas {
  id: string;
  title: { en: string; he: string };
  question: { en: string; he: string };

  /**
   * The debated opinions.
   */
  opinions: Opinion[];

  /**
   * Which opinion is "default" (for normative view).
   */
  defaultOpinionId?: string;

  /**
   * Level of the machlokas.
   */
  level: MachlokasLevel;

  /**
   * Where in shas this is discussed.
   */
  sources?: string[];

  /**
   * Brief explanation of the machlokas.
   */
  description?: { en: string; he: string };
}

/**
 * Condition: rule applies when specific opinions are selected.
 */
export interface OpinionCondition {
  machlokasId: string;
  opinionId: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Halachic Rules
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A halachic rule that produces a status when its pattern matches.
 */
export interface HalachicRule {
  id: string;
  name: { en: string; he: string };
  description?: { en: string; he: string };

  /**
   * What this rule evaluates (the relationship pattern).
   */
  pattern: RelationshipPattern;

  /**
   * What status it produces when pattern matches.
   */
  produces: {
    categoryId: string;
    statusName: { en: string; he: string };
  };

  /**
   * Which machlokos affect this rule.
   */
  dependsOnMachlokos: string[];

  /**
   * Condition: only applies when these opinion selections are made.
   * Empty = applies under all opinions.
   */
  appliesWhen: OpinionCondition[];

  /**
   * Source references for this rule.
   */
  sources?: string[];

  /**
   * Priority within same category (for display ordering).
   */
  priority?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Opinion Profile
// ═══════════════════════════════════════════════════════════════════════════

/**
 * User's current opinion selections.
 */
export interface OpinionProfile {
  id: string;
  name: string;
  description?: string;

  /**
   * Map of machlokasId -> selected opinionId.
   */
  selections: Record<string, string>;

  /**
   * When this profile was last modified.
   */
  lastModified?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Zikah (Levirate Bond) System
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Status of zikah (levirate bond).
 */
export type ZikahStatus =
  | 'shomeres-yavam' // Waiting for yibum/chalitzah
  | 'after-maamar' // After maamar (partial kinyan)
  | 'after-yibum' // After yibum completed
  | 'after-chalitzah' // After chalitzah completed
  | 'none'; // No zikah

/**
 * Information about a zikah relationship.
 */
export interface ZikahInfo {
  /**
   * Whether there is an active zikah.
   */
  isZakuk: boolean;

  /**
   * Person IDs of yevamim (brothers who could perform yibum).
   */
  zekukaTo?: string[];

  /**
   * Current status of the zikah.
   */
  status: ZikahStatus;

  /**
   * Edge ID of the original marriage that created this zikah.
   */
  originatingMarriage?: string;

  /**
   * Slice where zikah was created (husband's death).
   */
  createdAtSlice?: number;

  /**
   * Slice where zikah was resolved (yibum/chalitzah).
   */
  resolvedAtSlice?: number;

  /**
   * If resolved, how it was resolved.
   */
  resolution?: 'yibum' | 'chalitzah';

  /**
   * If there was a maamar, when it occurred.
   */
  maamarEvent?: EventRef;
}

// ═══════════════════════════════════════════════════════════════════════════
// Computed Status
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A status that was computed as applying to a person pair.
 */
export interface AppliedStatus {
  ruleId: string;
  category: StatusCategory;
  statusName: { en: string; he: string };
  explanation?: { en: string; he: string };
  relationshipPath?: RelationshipPath;
}

/**
 * Information about a relevant machlokas and alternative outcomes.
 */
export interface RelevantMachlokas {
  machlokas: Machlokas;
  currentSelection: Opinion;
  alternativeOutcomes: {
    opinion: Opinion;
    wouldProduceStatus: AppliedStatus | null;
  }[];
}

/**
 * The computed halachic status between two people.
 */
export interface ComputedStatus {
  personA: string;
  personB: string;

  /**
   * The primary status (most severe applicable).
   * null = mutar / no special status.
   */
  primaryStatus: {
    categoryId: string;
    ruleName: { en: string; he: string };
    relationshipPath?: RelationshipPath;
  } | null;

  /**
   * All applicable statuses (may be multiple).
   */
  allStatuses: AppliedStatus[];

  /**
   * Zikah-specific info (if applicable).
   */
  zikahInfo?: ZikahInfo;

  /**
   * Which machlokos affect this status.
   */
  relevantMachlokos: RelevantMachlokas[];

  /**
   * Cached at this slice index.
   */
  atSliceIndex: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Halachic State
// ═══════════════════════════════════════════════════════════════════════════

/**
 * State for the halachic overlay system.
 */
export interface HalachicState {
  /**
   * Whether halacha mode is enabled.
   */
  enabled: boolean;

  /**
   * Person currently locked for status viewing.
   */
  lockedPersonId: string | null;

  /**
   * Person currently being hovered (for comparison).
   */
  hoveredPersonId: string | null;

  /**
   * Current opinion profile.
   */
  opinionProfile: OpinionProfile;

  /**
   * Cached computed statuses.
   * Key format: `${personA}-${personB}-${sliceIndex}`
   */
  statusCache: Map<string, ComputedStatus>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Rule/Machlokas Registry
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Registry containing all rules and machlokos.
 */
export interface HalachicRegistry {
  /**
   * All status categories.
   */
  categories: StatusCategory[];

  /**
   * All halachic rules.
   */
  rules: HalachicRule[];

  /**
   * All machlokos.
   */
  machlokos: Machlokas[];

  /**
   * Pre-defined opinion profiles.
   */
  profiles: OpinionProfile[];
}
