/**
 * Status Engine
 *
 * The core engine that computes halachic statuses between people.
 * Evaluates rules against the graph and produces computed statuses.
 */

import { TemporalGraph, Person } from '@/types';
import { GraphQueryEngine } from '@/utils/graphQueries';
import { PatternMatcher } from './patternMatcher';
import { ZikahTracker } from './zikahTracker';
import { getCategoryById, DEFAULT_CATEGORIES } from './categories';
import {
  HalachicRule,
  StatusCategory,
  OpinionProfile,
  OpinionCondition,
  ComputedStatus,
  AppliedStatus,
  RelevantMachlokas,
  ZikahInfo,
  HalachicRegistry,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Status Engine Class
// ═══════════════════════════════════════════════════════════════════════════

export class StatusEngine {
  private graph: TemporalGraph;
  private engine: GraphQueryEngine;
  private patternMatcher: PatternMatcher;
  private zikahTracker: ZikahTracker;
  private registry: HalachicRegistry;

  // Cache for computed statuses
  private statusCache: Map<string, ComputedStatus> = new Map();

  constructor(graph: TemporalGraph, registry: HalachicRegistry) {
    this.graph = graph;
    this.registry = registry;
    this.engine = new GraphQueryEngine(graph);
    this.patternMatcher = new PatternMatcher(graph);
    this.zikahTracker = new ZikahTracker(graph);

    // Set up ervah checker for ZikahTracker to filter out ervah brothers
    this.zikahTracker.setErvahChecker((personA, personB, sliceIndex) => {
      return this.isErvahRelationship(personA, personB, sliceIndex);
    });
  }

  /**
   * Check if there is an ervah relationship between two people.
   * Used by ZikahTracker to filter out brothers who are arayos to the yevama.
   */
  private isErvahRelationship(
    personA: string,
    personB: string,
    sliceIndex: number
  ): boolean {
    // Check each rule for ervah patterns
    for (const rule of this.registry.rules) {
      // Only check Torah-level and rabbinic arayos
      if (
        rule.produces.categoryId !== 'ervah-doraita' &&
        rule.produces.categoryId !== 'shniyah'
      ) {
        continue;
      }

      // Match the pattern
      const matchResult = this.patternMatcher.matchPattern(
        personA,
        personB,
        rule.pattern,
        sliceIndex
      );

      if (matchResult.matches) {
        return true;
      }
    }

    return false;
  }

  /**
   * Compute the halachic status between two people.
   */
  computeStatus(
    personA: string,
    personB: string,
    sliceIndex: number,
    opinionProfile: OpinionProfile
  ): ComputedStatus {
    // Check cache
    const cacheKey = this.getCacheKey(personA, personB, sliceIndex, opinionProfile);
    const cached = this.statusCache.get(cacheKey);
    if (cached) return cached;

    // Compute fresh
    const status = this.computeStatusInternal(
      personA,
      personB,
      sliceIndex,
      opinionProfile
    );

    // Cache result
    this.statusCache.set(cacheKey, status);

    return status;
  }

  /**
   * Internal status computation.
   */
  private computeStatusInternal(
    personA: string,
    personB: string,
    sliceIndex: number,
    opinionProfile: OpinionProfile
  ): ComputedStatus {
    const allStatuses: AppliedStatus[] = [];
    const relevantMachlokos: RelevantMachlokas[] = [];

    // Check each rule
    for (const rule of this.registry.rules) {
      // Check if rule applies under current opinions
      if (!this.ruleAppliesWithOpinions(rule, opinionProfile)) {
        // Track as relevant machlokas if it would apply under different opinions
        const machlokas = this.getMachlokasForRule(rule, opinionProfile);
        if (machlokas) {
          relevantMachlokos.push(machlokas);
        }
        continue;
      }

      // Match the pattern
      const matchResult = this.patternMatcher.matchPattern(
        personA,
        personB,
        rule.pattern,
        sliceIndex
      );

      if (matchResult.matches) {
        const category = this.getCategory(rule.produces.categoryId);
        if (category) {
          allStatuses.push({
            ruleId: rule.id,
            category,
            statusName: rule.produces.statusName,
            explanation: rule.description,
            relationshipPath: matchResult.path,
          });
        }
      }
    }

    // Get zikah info
    const zikahInfo = this.getZikahInfoBetween(personA, personB, sliceIndex);

    // Add zikah-based status if applicable
    if (zikahInfo?.isZakuk) {
      const zikahCategory = this.getCategory('zikah-active');
      if (zikahCategory) {
        allStatuses.push({
          ruleId: 'zikah-active',
          category: zikahCategory,
          statusName: { en: 'Zikah Bond', he: 'זיקה' },
          explanation: {
            en: 'Active levirate bond between yavam and yevama',
            he: 'זיקה פעילה בין היבם והיבמה',
          },
        });
      }
    }

    // Sort by priority (highest first)
    allStatuses.sort((a, b) => b.category.priority - a.category.priority);

    // Determine primary status
    const primaryStatus =
      allStatuses.length > 0
        ? {
            categoryId: allStatuses[0].category.id,
            ruleName: allStatuses[0].statusName,
            relationshipPath: allStatuses[0].relationshipPath,
          }
        : null;

    return {
      personA,
      personB,
      primaryStatus,
      allStatuses,
      zikahInfo: zikahInfo || undefined,
      relevantMachlokos,
      atSliceIndex: sliceIndex,
    };
  }

  /**
   * Compute statuses for one person relative to all others.
   */
  computeAllStatuses(
    personId: string,
    sliceIndex: number,
    opinionProfile: OpinionProfile
  ): Map<string, ComputedStatus> {
    const results = new Map<string, ComputedStatus>();

    // Get all people alive at this slice
    const people = Object.values(this.graph.nodes).filter(
      (p) => p.id !== personId && this.engine.isAlive(p.id, sliceIndex)
    );

    for (const person of people) {
      const status = this.computeStatus(
        personId,
        person.id,
        sliceIndex,
        opinionProfile
      );
      results.set(person.id, status);
    }

    return results;
  }

  /**
   * Check if a rule applies under the given opinion profile.
   */
  private ruleAppliesWithOpinions(
    rule: HalachicRule,
    profile: OpinionProfile
  ): boolean {
    // If no conditions, rule always applies
    if (rule.appliesWhen.length === 0) return true;

    // All conditions must be met
    return rule.appliesWhen.every((condition) =>
      this.opinionConditionMet(condition, profile)
    );
  }

  /**
   * Check if a single opinion condition is met.
   */
  private opinionConditionMet(
    condition: OpinionCondition,
    profile: OpinionProfile
  ): boolean {
    const selected = profile.selections[condition.machlokasId];
    return selected === condition.opinionId;
  }

  /**
   * Get relevant machlokas info for a rule.
   */
  private getMachlokasForRule(
    rule: HalachicRule,
    currentProfile: OpinionProfile
  ): RelevantMachlokas | null {
    if (rule.dependsOnMachlokos.length === 0) return null;

    // Find the first machlokas that affects this rule
    for (const machlokasId of rule.dependsOnMachlokos) {
      const machlokas = this.registry.machlokos.find((m) => m.id === machlokasId);
      if (!machlokas) continue;

      const currentSelection = machlokas.opinions.find(
        (o) => o.id === currentProfile.selections[machlokasId]
      );

      if (!currentSelection) continue;

      // Calculate alternative outcomes
      const alternativeOutcomes = machlokas.opinions
        .filter((o) => o.id !== currentSelection.id)
        .map((opinion) => {
          // Would rule apply with this opinion?
          const wouldApply = this.wouldRuleApplyWithOpinion(
            rule,
            currentProfile,
            machlokasId,
            opinion.id
          );

          return {
            opinion,
            wouldProduceStatus: wouldApply
              ? {
                  ruleId: rule.id,
                  category: this.getCategory(rule.produces.categoryId)!,
                  statusName: rule.produces.statusName,
                }
              : null,
          };
        });

      return {
        machlokas,
        currentSelection,
        alternativeOutcomes,
      };
    }

    return null;
  }

  /**
   * Check if a rule would apply with a different opinion.
   */
  private wouldRuleApplyWithOpinion(
    rule: HalachicRule,
    currentProfile: OpinionProfile,
    machlokasId: string,
    opinionId: string
  ): boolean {
    // Create a modified profile
    const modifiedProfile: OpinionProfile = {
      ...currentProfile,
      selections: {
        ...currentProfile.selections,
        [machlokasId]: opinionId,
      },
    };

    return this.ruleAppliesWithOpinions(rule, modifiedProfile);
  }

  /**
   * Get a category by ID.
   */
  private getCategory(id: string): StatusCategory | undefined {
    return (
      this.registry.categories.find((c) => c.id === id) ||
      getCategoryById(id, DEFAULT_CATEGORIES)
    );
  }

  /**
   * Get zikah info between two people.
   */
  private getZikahInfoBetween(
    personA: string,
    personB: string,
    sliceIndex: number
  ): ZikahInfo | null {
    return this.zikahTracker.getZikahBetween(personA, personB, sliceIndex);
  }

  /**
   * Generate cache key for a status computation.
   */
  private getCacheKey(
    personA: string,
    personB: string,
    sliceIndex: number,
    profile: OpinionProfile
  ): string {
    // Sort person IDs for consistent keys regardless of order
    const [p1, p2] = [personA, personB].sort();
    const profileHash = JSON.stringify(profile.selections);
    return `${p1}-${p2}-${sliceIndex}-${profileHash}`;
  }

  /**
   * Clear the status cache.
   */
  clearCache(): void {
    this.statusCache.clear();
  }

  /**
   * Refresh after graph changes.
   */
  refresh(): void {
    this.clearCache();
    this.zikahTracker.refresh();
    this.patternMatcher = new PatternMatcher(this.graph);
    this.engine = new GraphQueryEngine(this.graph);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Convenience Query Methods
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get all people who have a specific status category with the given person.
   */
  getPeopleWithStatus(
    personId: string,
    categoryId: string,
    sliceIndex: number,
    opinionProfile: OpinionProfile
  ): Person[] {
    const allStatuses = this.computeAllStatuses(
      personId,
      sliceIndex,
      opinionProfile
    );

    const matches: Person[] = [];
    for (const [otherId, status] of allStatuses) {
      if (status.allStatuses.some((s) => s.category.id === categoryId)) {
        const person = this.graph.nodes[otherId];
        if (person) matches.push(person);
      }
    }

    return matches;
  }

  /**
   * Check if a specific status exists between two people.
   */
  hasStatus(
    personA: string,
    personB: string,
    categoryId: string,
    sliceIndex: number,
    opinionProfile: OpinionProfile
  ): boolean {
    const status = this.computeStatus(
      personA,
      personB,
      sliceIndex,
      opinionProfile
    );

    return status.allStatuses.some((s) => s.category.id === categoryId);
  }

  /**
   * Get the primary status category between two people.
   */
  getPrimaryCategory(
    personA: string,
    personB: string,
    sliceIndex: number,
    opinionProfile: OpinionProfile
  ): StatusCategory | null {
    const status = this.computeStatus(
      personA,
      personB,
      sliceIndex,
      opinionProfile
    );

    if (!status.primaryStatus) return null;

    return this.getCategory(status.primaryStatus.categoryId) || null;
  }

  /**
   * Check if marriage is permitted between two people.
   */
  isMarriagePermitted(
    personA: string,
    personB: string,
    sliceIndex: number,
    opinionProfile: OpinionProfile
  ): boolean {
    const status = this.computeStatus(
      personA,
      personB,
      sliceIndex,
      opinionProfile
    );

    // Check for any prohibitive categories
    const prohibitiveCategories = [
      'ervah-doraita',
      'ervah-drabbanan',
      'shniyah',
      'mamzer',
    ];

    const hasProhibition = status.allStatuses.some((s) =>
      prohibitiveCategories.includes(s.category.id)
    );

    if (!hasProhibition) {
      return true;
    }

    // Special case: Active zikah overrides Brother's Wife ervah for yibum
    // Check if the ONLY ervah is Brother's Wife AND there's active zikah
    const zikahInfo = this.getZikahInfoBetween(personA, personB, sliceIndex);
    if (zikahInfo?.isZakuk) {
      // Check if all prohibitions are Brother's Wife (which is overridden by yibum)
      const onlyBrothersWife = status.allStatuses
        .filter((s) => prohibitiveCategories.includes(s.category.id))
        .every((s) => s.ruleId === 'ervah-brothers-wife');

      if (onlyBrothersWife) {
        // Yibum is permitted - zikah overrides the Brother's Wife ervah
        return true;
      }
    }

    return false;
  }

  /**
   * Get all yevamos at a given slice.
   */
  getYevamos(sliceIndex: number): Person[] {
    const yevamas = this.zikahTracker.getYevamos(sliceIndex);
    return yevamas
      .map((id) => this.graph.nodes[id])
      .filter((p): p is Person => p !== undefined);
  }

  /**
   * Get all yevamim for a specific yevama.
   */
  getYevamimFor(yevamaId: string, sliceIndex: number): Person[] {
    const yevamim = this.zikahTracker.getYevamimFor(yevamaId, sliceIndex);
    return yevamim
      .map((id) => this.graph.nodes[id])
      .filter((p): p is Person => p !== undefined);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Factory Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a status engine with the given registry.
 */
export function createStatusEngine(
  graph: TemporalGraph,
  registry: HalachicRegistry
): StatusEngine {
  return new StatusEngine(graph, registry);
}

/**
 * Create a status engine with default (empty) registry.
 * Useful for testing or when rules will be added later.
 */
export function createEmptyStatusEngine(graph: TemporalGraph): StatusEngine {
  const emptyRegistry: HalachicRegistry = {
    categories: DEFAULT_CATEGORIES,
    rules: [],
    machlokos: [],
    profiles: [],
  };

  return new StatusEngine(graph, emptyRegistry);
}

/**
 * Create a default opinion profile (selects default opinions).
 */
export function createDefaultOpinionProfile(
  registry: HalachicRegistry
): OpinionProfile {
  const selections: Record<string, string> = {};

  for (const machlokas of registry.machlokos) {
    if (machlokas.defaultOpinionId) {
      selections[machlokas.id] = machlokas.defaultOpinionId;
    } else if (machlokas.opinions.length > 0) {
      selections[machlokas.id] = machlokas.opinions[0].id;
    }
  }

  return {
    id: 'default',
    name: 'Default',
    description: 'Default opinion profile',
    selections,
    lastModified: Date.now(),
  };
}
