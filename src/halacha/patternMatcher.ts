/**
 * Pattern Matcher
 *
 * Matches relationship patterns against the temporal graph.
 * This is the core logic for evaluating which halachic rules apply.
 */

import { TemporalGraph } from '@/types';
import { GraphQueryEngine, RelationshipPath } from '@/utils/graphQueries';
import {
  RelationshipPattern,
  StateCondition,
  TemporalCondition,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Pattern Match Result
// ═══════════════════════════════════════════════════════════════════════════

export interface PatternMatchResult {
  matches: boolean;
  path?: RelationshipPath;
  explanation?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Pattern Matcher Class
// ═══════════════════════════════════════════════════════════════════════════

export class PatternMatcher {
  private engine: GraphQueryEngine;
  private graph: TemporalGraph;

  constructor(graph: TemporalGraph) {
    this.graph = graph;
    this.engine = new GraphQueryEngine(graph);
  }

  /**
   * Check if a pattern matches between two people at a given slice.
   */
  matchPattern(
    personA: string,
    personB: string,
    pattern: RelationshipPattern,
    sliceIndex: number
  ): PatternMatchResult {
    switch (pattern.type) {
      case 'direct':
        return this.matchDirectPattern(personA, personB, pattern, sliceIndex);

      case 'path':
        return this.matchPathPattern(personA, personB, pattern, sliceIndex);

      case 'state':
        return this.matchStatePattern(personA, personB, pattern, sliceIndex);

      case 'temporal':
        return this.matchTemporalPattern(personA, personB, pattern, sliceIndex);

      case 'composite':
        return this.matchCompositePattern(personA, personB, pattern, sliceIndex);

      default:
        return { matches: false };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Direct Pattern Matching
  // ─────────────────────────────────────────────────────────────────────────

  private matchDirectPattern(
    personA: string,
    personB: string,
    pattern: RelationshipPattern,
    sliceIndex: number
  ): PatternMatchResult {
    if (!pattern.directEdgeTypes || pattern.directEdgeTypes.length === 0) {
      return { matches: false };
    }

    const relationships = this.engine.getRelationshipsBetween(
      personA,
      personB,
      sliceIndex
    );

    for (const rel of relationships) {
      if (pattern.directEdgeTypes.includes(rel.type)) {
        return {
          matches: true,
          explanation: `Direct ${rel.type} relationship`,
        };
      }
    }

    return { matches: false };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Path Pattern Matching
  // ─────────────────────────────────────────────────────────────────────────

  private matchPathPattern(
    personA: string,
    personB: string,
    pattern: RelationshipPattern,
    sliceIndex: number
  ): PatternMatchResult {
    if (!pattern.pathPattern) {
      return { matches: false };
    }

    // Parse path pattern (e.g., "spouse.sibling" = B is sibling of A's spouse)
    const steps = pattern.pathPattern.split('.');

    // Find the path
    const path = this.findPathByPattern(personA, personB, steps, sliceIndex, pattern.throughGender);

    if (path) {
      return {
        matches: true,
        path,
        explanation: `Path: ${pattern.pathPattern}`,
      };
    }

    return { matches: false };
  }

  /**
   * Find a path matching the step pattern.
   */
  private findPathByPattern(
    start: string,
    end: string,
    steps: string[],
    sliceIndex: number,
    throughGender?: 'male' | 'female'
  ): RelationshipPath | null {
    if (steps.length === 0) {
      return start === end
        ? { steps: [], description: { en: 'Same person', he: 'אותו אדם' } }
        : null;
    }

    // Get candidates for first step
    const candidates = this.getStepCandidates(start, steps[0], sliceIndex);

    // Filter by gender if required
    const filtered = throughGender
      ? candidates.filter((c) => {
          const person = this.graph.nodes[c.personId];
          return person && person.gender === throughGender;
        })
      : candidates;

    // Recursively try each candidate
    for (const candidate of filtered) {
      const remainingPath = this.findPathByPattern(
        candidate.personId,
        end,
        steps.slice(1),
        sliceIndex,
        throughGender
      );

      if (remainingPath) {
        return {
          steps: [
            {
              fromPerson: start,
              toPerson: candidate.personId,
              relationship: candidate.relationship,
              edgeId: candidate.edgeId,
            },
            ...remainingPath.steps,
          ],
          description: this.buildPathDescription(steps),
        };
      }
    }

    return null;
  }

  /**
   * Get candidates for a single relationship step.
   */
  private getStepCandidates(
    personId: string,
    step: string,
    sliceIndex: number
  ): Array<{ personId: string; relationship: 'parent' | 'child' | 'sibling' | 'spouse' | 'yavam' | 'yevama'; edgeId?: string }> {
    const candidates: Array<{
      personId: string;
      relationship: 'parent' | 'child' | 'sibling' | 'spouse' | 'yavam' | 'yevama';
      edgeId?: string;
    }> = [];

    switch (step) {
      case 'spouse':
        for (const spouse of this.engine.getSpouses(personId, sliceIndex)) {
          candidates.push({ personId: spouse.id, relationship: 'spouse' });
        }
        break;

      case 'parent':
        for (const parent of this.engine.getParents(personId, sliceIndex)) {
          candidates.push({ personId: parent.id, relationship: 'parent' });
        }
        break;

      case 'child':
        for (const child of this.engine.getChildren(personId, sliceIndex)) {
          candidates.push({ personId: child.id, relationship: 'child' });
        }
        break;

      case 'sibling':
        for (const sibling of this.engine.getSiblings(personId, sliceIndex)) {
          candidates.push({ personId: sibling.id, relationship: 'sibling' });
        }
        break;

      case 'yavam':
      case 'yevama':
        // Yavam/yevama are found through deceased spouse's siblings
        // This requires checking for zikah - handled separately
        break;

      default:
        // Unknown step type
        break;
    }

    return candidates;
  }

  /**
   * Build human-readable path description.
   */
  private buildPathDescription(steps: string[]): { en: string; he: string } {
    const enParts: string[] = [];
    const heParts: string[] = [];

    const translations: Record<string, { en: string; he: string }> = {
      spouse: { en: 'spouse', he: 'בן/בת זוג' },
      parent: { en: 'parent', he: 'הורה' },
      child: { en: 'child', he: 'ילד' },
      sibling: { en: 'sibling', he: 'אח/אחות' },
      yavam: { en: 'yavam', he: 'יבם' },
      yevama: { en: 'yevama', he: 'יבמה' },
    };

    for (const step of steps) {
      const t = translations[step];
      if (t) {
        enParts.push(t.en);
        heParts.push(t.he);
      } else {
        enParts.push(step);
        heParts.push(step);
      }
    }

    // Format as "A's B's C" in English
    const enDescription =
      enParts.length === 1
        ? enParts[0]
        : enParts.slice(0, -1).join("'s ") + "'s " + enParts[enParts.length - 1];

    return {
      en: enDescription,
      he: heParts.join(' של '),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // State Pattern Matching
  // ─────────────────────────────────────────────────────────────────────────

  private matchStatePattern(
    personA: string,
    personB: string,
    pattern: RelationshipPattern,
    sliceIndex: number
  ): PatternMatchResult {
    if (!pattern.stateConditions || pattern.stateConditions.length === 0) {
      return { matches: true }; // No conditions = matches
    }

    for (const condition of pattern.stateConditions) {
      const personId = condition.person === 'A' ? personA : personB;
      const result = this.evaluateStateCondition(personId, condition, sliceIndex);

      if (!result) {
        return { matches: false };
      }
    }

    return { matches: true };
  }

  /**
   * Evaluate a single state condition.
   */
  private evaluateStateCondition(
    personId: string,
    condition: StateCondition,
    sliceIndex: number
  ): boolean {
    let result: boolean;

    switch (condition.condition) {
      case 'alive':
        result = this.engine.isAlive(personId, sliceIndex);
        break;

      case 'dead':
        result = !this.engine.isAlive(personId, sliceIndex);
        break;

      case 'married':
        result = this.engine.isMarried(personId, sliceIndex);
        break;

      case 'unmarried':
        result = !this.engine.isMarried(personId, sliceIndex);
        break;

      case 'has-children':
      case 'has-living-children':
        result = this.engine.hasChildren(personId, sliceIndex);
        break;

      case 'childless':
        result = !this.engine.hasChildren(personId, sliceIndex);
        break;

      case 'has-brothers': {
        const siblings = this.engine.getSiblings(personId, sliceIndex);
        const brothers = siblings.filter((s) => s.gender === 'male');
        result = brothers.length > 0;
        break;
      }

      case 'is-kohen':
      case 'is-levi':
      case 'is-yisrael':
        // These would require additional person metadata
        // For now, return false (not implemented)
        result = false;
        break;

      default:
        result = false;
    }

    return condition.negate ? !result : result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Temporal Pattern Matching
  // ─────────────────────────────────────────────────────────────────────────

  private matchTemporalPattern(
    personA: string,
    personB: string,
    pattern: RelationshipPattern,
    sliceIndex: number
  ): PatternMatchResult {
    if (!pattern.temporalConditions || pattern.temporalConditions.length === 0) {
      return { matches: true };
    }

    for (const condition of pattern.temporalConditions) {
      const result = this.evaluateTemporalCondition(
        personA,
        personB,
        condition,
        sliceIndex
      );

      if (!result) {
        return { matches: false };
      }
    }

    return { matches: true };
  }

  /**
   * Evaluate a temporal condition.
   */
  private evaluateTemporalCondition(
    personA: string,
    personB: string,
    condition: TemporalCondition,
    sliceIndex: number
  ): boolean {
    let result: boolean;

    switch (condition.type) {
      case 'alive-when':
        result = this.evaluateAliveWhen(personA, personB, condition);
        break;

      case 'lifetime-overlap':
        result = this.evaluateLifetimeOverlap(personA, personB, condition);
        break;

      case 'event-order':
        result = this.evaluateEventOrder(personA, personB, condition);
        break;

      case 'had-children-when':
        result = this.evaluateHadChildrenWhen(personA, personB, condition);
        break;

      case 'relationship-existed-when':
        result = this.evaluateRelationshipExistedWhen(
          personA,
          personB,
          condition,
          sliceIndex
        );
        break;

      default:
        result = false;
    }

    return condition.negate ? !result : result;
  }

  /**
   * Resolve a subject reference to a person ID.
   */
  private resolveSubject(
    personA: string,
    personB: string,
    subject: string | undefined,
    sliceIndex: number
  ): string | null {
    if (!subject) return null;

    switch (subject) {
      case 'A':
        return personA;
      case 'B':
        return personB;
      case 'spouse-of-A': {
        const spouses = this.engine.getSpouses(personA, sliceIndex);
        return spouses.length > 0 ? spouses[0].id : null;
      }
      case 'spouse-of-B': {
        const spouses = this.engine.getSpouses(personB, sliceIndex);
        return spouses.length > 0 ? spouses[0].id : null;
      }
      case 'child-of-A': {
        const children = this.engine.getChildren(personA, sliceIndex);
        return children.length > 0 ? children[0].id : null;
      }
      case 'child-of-B': {
        const children = this.engine.getChildren(personB, sliceIndex);
        return children.length > 0 ? children[0].id : null;
      }
      default:
        return null;
    }
  }

  /**
   * Map conceptual event types to actual TemporalEvent types.
   * 'birth' → 'addNode'
   * 'death' → 'death'
   * 'marriage' and others require edge-based lookups which are more complex.
   */
  private mapEventType(
    conceptualType: string
  ): 'death' | 'addNode' | null {
    switch (conceptualType) {
      case 'death':
        return 'death';
      case 'birth':
        return 'addNode';
      default:
        // marriage, divorce, yibum, chalitzah are edge-based events
        // and require different handling
        return null;
    }
  }

  /**
   * Evaluate "was X alive when Y happened?"
   */
  private evaluateAliveWhen(
    personA: string,
    personB: string,
    condition: TemporalCondition
  ): boolean {
    if (!condition.subject || !condition.event) return false;

    // Resolve subject person
    // Use a high slice index to get all people
    const subjectId = this.resolveSubject(
      personA,
      personB,
      condition.subject,
      this.graph.slices.length - 1
    );
    if (!subjectId) return false;

    // Resolve event person
    const eventPersonId = this.resolveSubject(
      personA,
      personB,
      condition.event.of,
      this.graph.slices.length - 1
    );
    if (!eventPersonId) return false;

    // For death events, use the specialized function
    if (condition.event.type === 'death') {
      return this.engine.wasAliveWhenPersonDied(subjectId, eventPersonId);
    }

    // Map to actual event type
    const eventType = this.mapEventType(condition.event.type);
    if (!eventType) return false; // Unsupported event type

    // For other event types, find the event and check
    const event = this.engine.findEvent({
      type: eventType,
      personId: eventPersonId,
    });

    if (!event) return false;

    return this.engine.wasAliveWhen(subjectId, event);
  }

  /**
   * Evaluate "did lifetimes overlap?"
   */
  private evaluateLifetimeOverlap(
    personA: string,
    personB: string,
    condition: TemporalCondition
  ): boolean {
    const personId1 = personA;
    const personId2 = this.resolveSubject(
      personA,
      personB,
      condition.overlapWith,
      this.graph.slices.length - 1
    );

    if (!personId2) return false;

    return this.engine.lifetimesOverlap(personId1, personId2);
  }

  /**
   * Evaluate "did event X happen before event Y?"
   */
  private evaluateEventOrder(
    personA: string,
    personB: string,
    condition: TemporalCondition
  ): boolean {
    if (!condition.firstEvent || !condition.secondEvent) return false;

    // Resolve first event
    const firstPersonId = this.resolveSubject(
      personA,
      personB,
      condition.firstEvent.of,
      this.graph.slices.length - 1
    );
    if (!firstPersonId) return false;

    const firstEventType = this.mapEventType(condition.firstEvent.type);
    if (!firstEventType) return false;

    const firstEvent = this.engine.findEvent({
      type: firstEventType,
      personId: firstPersonId,
    });
    if (!firstEvent) return false;

    // Resolve second event
    const secondPersonId = this.resolveSubject(
      personA,
      personB,
      condition.secondEvent.of,
      this.graph.slices.length - 1
    );
    if (!secondPersonId) return false;

    const secondEventType = this.mapEventType(condition.secondEvent.type);
    if (!secondEventType) return false;

    const secondEvent = this.engine.findEvent({
      type: secondEventType,
      personId: secondPersonId,
    });
    if (!secondEvent) return false;

    // Check order
    return this.engine.eventOrder(firstEvent, secondEvent) === 'before';
  }

  /**
   * Evaluate "did person have living children when event occurred?"
   */
  private evaluateHadChildrenWhen(
    personA: string,
    personB: string,
    condition: TemporalCondition
  ): boolean {
    if (!condition.subject || !condition.event) return false;

    const subjectId = this.resolveSubject(
      personA,
      personB,
      condition.subject,
      this.graph.slices.length - 1
    );
    if (!subjectId) return false;

    const eventPersonId = this.resolveSubject(
      personA,
      personB,
      condition.event.of,
      this.graph.slices.length - 1
    );
    if (!eventPersonId) return false;

    // Find the event
    const eventType = this.mapEventType(condition.event.type);
    if (!eventType) return false;

    const event = this.engine.findEvent({
      type: eventType,
      personId: eventPersonId,
    });

    if (!event) return false;

    return this.engine.hadLivingChildrenWhen(subjectId, event);
  }

  /**
   * Evaluate "did relationship exist when event occurred?"
   */
  private evaluateRelationshipExistedWhen(
    personA: string,
    personB: string,
    condition: TemporalCondition,
    sliceIndex: number
  ): boolean {
    if (!condition.relationship || !condition.event) return false;

    // Resolve the two people in the relationship
    const [ref1, ref2] = condition.relationship.between;
    const person1 = this.resolveSubject(personA, personB, ref1, sliceIndex);
    const person2 = this.resolveSubject(personA, personB, ref2, sliceIndex);

    if (!person1 || !person2) return false;

    // Find the event
    const eventPersonId = this.resolveSubject(
      personA,
      personB,
      condition.event.of,
      this.graph.slices.length - 1
    );
    if (!eventPersonId) return false;

    const eventType = this.mapEventType(condition.event.type);
    if (!eventType) return false;

    const event = this.engine.findEvent({
      type: eventType,
      personId: eventPersonId,
    });

    if (!event) return false;

    // Check if relationship existed at that moment
    return this.engine.relationshipExistedWhen(
      person1,
      person2,
      condition.relationship.type,
      event
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Composite Pattern Matching
  // ─────────────────────────────────────────────────────────────────────────

  private matchCompositePattern(
    personA: string,
    personB: string,
    pattern: RelationshipPattern,
    sliceIndex: number
  ): PatternMatchResult {
    if (!pattern.subPatterns || pattern.subPatterns.length === 0) {
      return { matches: true };
    }

    const results = pattern.subPatterns.map((subPattern) =>
      this.matchPattern(personA, personB, subPattern, sliceIndex)
    );

    if (pattern.compositeOp === 'and') {
      // All must match
      const allMatch = results.every((r) => r.matches);
      return {
        matches: allMatch,
        explanation: allMatch ? 'All conditions met' : 'Not all conditions met',
      };
    } else {
      // At least one must match (or)
      const firstMatch = results.find((r) => r.matches);
      return firstMatch || { matches: false };
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Convenience Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a pattern matcher for a graph.
 */
export function createPatternMatcher(graph: TemporalGraph): PatternMatcher {
  return new PatternMatcher(graph);
}

/**
 * Quick check if a pattern matches.
 */
export function patternMatches(
  graph: TemporalGraph,
  personA: string,
  personB: string,
  pattern: RelationshipPattern,
  sliceIndex: number
): boolean {
  const matcher = new PatternMatcher(graph);
  return matcher.matchPattern(personA, personB, pattern, sliceIndex).matches;
}
