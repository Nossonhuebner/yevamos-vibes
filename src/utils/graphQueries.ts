/**
 * Graph Query Engine with Temporal Awareness
 *
 * Provides utilities for querying relationships and states from the temporal graph.
 * Key insight: Halacha often cares about the state at the MOMENT an event occurred,
 * not just the final state of a slice.
 */

import { Person, Relationship, RelationshipType, TemporalGraph, ResolvedGraphState } from '@/types';
import { resolveGraphAtSlice } from './deltaResolver';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Reference to a specific point in time (more granular than slice).
 * Events are ordered by (sliceIndex, eventIndex).
 */
export interface EventRef {
  sliceIndex: number;
  eventIndex: number;
}

/**
 * Identifier for locating a specific event in the graph.
 */
export interface EventIdentifier {
  type: 'death' | 'addNode' | 'addEdge' | 'updateEdge' | 'removeEdge';
  personId?: string;  // For death/addNode
  edgeId?: string;    // For edge events
}

/**
 * A step in a relationship path between two people.
 */
export interface PathStep {
  fromPerson: string;
  toPerson: string;
  relationship: 'parent' | 'child' | 'sibling' | 'spouse' | 'yavam' | 'yevama';
  edgeId?: string;
}

/**
 * A path of relationships between two people.
 */
export interface RelationshipPath {
  steps: PathStep[];
  description: { en: string; he: string };
}

// ═══════════════════════════════════════════════════════════════════════════
// Graph Query Engine Class
// ═══════════════════════════════════════════════════════════════════════════

export class GraphQueryEngine {
  private graph: TemporalGraph;
  private resolvedStates: ResolvedGraphState[];

  constructor(graph: TemporalGraph, resolvedStates?: ResolvedGraphState[]) {
    this.graph = graph;
    this.resolvedStates = resolvedStates || this.computeAllResolvedStates();
  }

  private computeAllResolvedStates(): ResolvedGraphState[] {
    const states: ResolvedGraphState[] = [];
    for (let i = 0; i < this.graph.slices.length; i++) {
      states.push(resolveGraphAtSlice(this.graph, i));
    }
    return states;
  }

  /**
   * Get the resolved state at a specific slice.
   */
  getStateAtSlice(sliceIndex: number): ResolvedGraphState | null {
    return this.resolvedStates[sliceIndex] || null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLICE-LEVEL QUERIES (state at end of slice)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get all relationships between two people at a given slice.
   */
  getRelationshipsBetween(personA: string, personB: string, sliceIndex: number): Relationship[] {
    const state = this.getStateAtSlice(sliceIndex);
    if (!state) return [];

    const results: Relationship[] = [];
    for (const edge of state.edges.values()) {
      if ((edge.sourceId === personA && edge.targetId === personB) ||
          (edge.sourceId === personB && edge.targetId === personA)) {
        results.push(edge);
      }
    }
    return results;
  }

  /**
   * Get all relationships of a person at a given slice.
   */
  getRelationshipsOf(personId: string, sliceIndex: number): Relationship[] {
    const state = this.getStateAtSlice(sliceIndex);
    if (!state) return [];

    const results: Relationship[] = [];
    for (const edge of state.edges.values()) {
      if (edge.sourceId === personId || edge.targetId === personId) {
        results.push(edge);
      }
    }
    return results;
  }

  /**
   * Get parents of a person at a given slice.
   * Parents are connected via 'parent-child' edges where person is the target (child).
   */
  getParents(personId: string, sliceIndex: number): Person[] {
    const state = this.getStateAtSlice(sliceIndex);
    if (!state) return [];

    const parents: Person[] = [];
    for (const edge of state.edges.values()) {
      if (edge.type === 'parent-child' && edge.targetId === personId) {
        const parent = state.nodes.get(edge.sourceId);
        if (parent) parents.push(parent);
      }
    }
    return parents;
  }

  /**
   * Get children of a person at a given slice.
   * Children are connected via 'parent-child' edges where person is the source (parent).
   */
  getChildren(personId: string, sliceIndex: number): Person[] {
    const state = this.getStateAtSlice(sliceIndex);
    if (!state) return [];

    const children: Person[] = [];
    for (const edge of state.edges.values()) {
      if (edge.type === 'parent-child' && edge.sourceId === personId) {
        const child = state.nodes.get(edge.targetId);
        if (child) children.push(child);
      }
    }
    return children;
  }

  /**
   * Get siblings of a person at a given slice.
   * Siblings share at least one parent.
   */
  getSiblings(personId: string, sliceIndex: number): Person[] {
    const parents = this.getParents(personId, sliceIndex);
    const state = this.getStateAtSlice(sliceIndex);
    if (!state || parents.length === 0) return [];

    const siblingIds = new Set<string>();
    for (const parent of parents) {
      const parentChildren = this.getChildren(parent.id, sliceIndex);
      for (const child of parentChildren) {
        if (child.id !== personId) {
          siblingIds.add(child.id);
        }
      }
    }

    return Array.from(siblingIds).map(id => state.nodes.get(id)!).filter(Boolean);
  }

  /**
   * Get spouses of a person at a given slice.
   * Spouse relationships: erusin, nisuin, yibum (not divorce, chalitzah).
   */
  getSpouses(personId: string, sliceIndex: number): Person[] {
    const state = this.getStateAtSlice(sliceIndex);
    if (!state) return [];

    const spouseTypes: RelationshipType[] = ['erusin', 'nisuin', 'yibum'];
    const spouses: Person[] = [];

    for (const edge of state.edges.values()) {
      if (spouseTypes.includes(edge.type)) {
        if (edge.sourceId === personId) {
          const spouse = state.nodes.get(edge.targetId);
          if (spouse) spouses.push(spouse);
        } else if (edge.targetId === personId) {
          const spouse = state.nodes.get(edge.sourceId);
          if (spouse) spouses.push(spouse);
        }
      }
    }
    return spouses;
  }

  /**
   * Check if a person is married at a given slice.
   */
  isMarried(personId: string, sliceIndex: number): boolean {
    return this.getSpouses(personId, sliceIndex).length > 0;
  }

  /**
   * Check if a person has children at a given slice.
   */
  hasChildren(personId: string, sliceIndex: number): boolean {
    return this.getChildren(personId, sliceIndex).length > 0;
  }

  /**
   * Check if a person is alive at a given slice.
   */
  isAlive(personId: string, sliceIndex: number): boolean {
    const person = this.graph.nodes[personId];
    if (!person) return false;

    // Not yet born
    if (person.introducedSliceIndex > sliceIndex) return false;

    // Check death
    if (person.deathSliceIndex === undefined) return true;
    return person.deathSliceIndex > sliceIndex;
  }

  /**
   * Check if a person has any living children at a given slice.
   */
  hasLivingChildren(personId: string, sliceIndex: number): boolean {
    const children = this.getChildren(personId, sliceIndex);
    return children.some(child => this.isAlive(child.id, sliceIndex));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT-RELATIVE QUERIES (state at moment of specific event)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Find the EventRef for a specific event.
   */
  findEvent(identifier: EventIdentifier): EventRef | null {
    for (let sliceIndex = 0; sliceIndex < this.graph.slices.length; sliceIndex++) {
      const slice = this.graph.slices[sliceIndex];
      for (let eventIndex = 0; eventIndex < slice.events.length; eventIndex++) {
        const event = slice.events[eventIndex];

        if (event.type === identifier.type) {
          if (identifier.type === 'death' && 'nodeId' in event && event.nodeId === identifier.personId) {
            return { sliceIndex, eventIndex };
          }
          if (identifier.type === 'addNode' && 'nodeId' in event && event.nodeId === identifier.personId) {
            return { sliceIndex, eventIndex };
          }
          if (identifier.type === 'addEdge' && 'edgeId' in event && event.edgeId === identifier.edgeId) {
            return { sliceIndex, eventIndex };
          }
          if (identifier.type === 'updateEdge' && 'edgeId' in event && event.edgeId === identifier.edgeId) {
            return { sliceIndex, eventIndex };
          }
          if (identifier.type === 'removeEdge' && 'edgeId' in event && event.edgeId === identifier.edgeId) {
            return { sliceIndex, eventIndex };
          }
        }
      }
    }
    return null;
  }

  /**
   * Find when a person died (as an EventRef).
   */
  findDeathEvent(personId: string): EventRef | null {
    return this.findEvent({ type: 'death', personId });
  }

  /**
   * Check if a person was alive at a specific event.
   * The person is considered alive if:
   * - They were introduced before or at the event's slice
   * - They died after the event (or never died)
   */
  wasAliveWhen(personId: string, event: EventRef): boolean {
    const person = this.graph.nodes[personId];
    if (!person) return false;

    // Not yet introduced
    if (person.introducedSliceIndex > event.sliceIndex) return false;

    // Never died
    if (person.deathSliceIndex === undefined) return true;

    // Died in a later slice
    if (person.deathSliceIndex > event.sliceIndex) return true;

    // Died in an earlier slice
    if (person.deathSliceIndex < event.sliceIndex) return false;

    // Died in the same slice - check event ordering
    const deathEvent = this.findDeathEvent(personId);
    if (!deathEvent) return true; // No death event found, assume alive

    // Person is alive if the query event is BEFORE their death event
    return event.eventIndex < deathEvent.eventIndex;
  }

  /**
   * Check if person A was alive when person B died.
   */
  wasAliveWhenPersonDied(personId: string, deceasedId: string): boolean {
    const deathEvent = this.findDeathEvent(deceasedId);
    if (!deathEvent) return false; // Deceased person never died in the graph

    return this.wasAliveWhen(personId, deathEvent);
  }

  /**
   * Check if a person was married at the moment of a specific event.
   */
  wasMarriedWhen(personId: string, event: EventRef): boolean {
    // Get state at the slice, but we need to check event ordering
    const spouses = this.getSpousesWhen(personId, event);
    return spouses.length > 0;
  }

  /**
   * Get spouses of a person at the moment of a specific event.
   * This considers the temporal ordering of events.
   */
  getSpousesWhen(personId: string, event: EventRef): Person[] {
    const state = this.getStateAtSlice(event.sliceIndex);
    if (!state) return [];

    const spouseTypes: RelationshipType[] = ['erusin', 'nisuin', 'yibum'];
    const spouses: Person[] = [];

    // We need to consider marriages that exist at this exact moment
    // A marriage exists if:
    // 1. It was introduced before or at this slice
    // 2. If introduced in the same slice, the addEdge event is before the query event
    // 3. The spouse is alive at this moment

    for (const edge of state.edges.values()) {
      if (!spouseTypes.includes(edge.type)) continue;

      const spouseId = edge.sourceId === personId ? edge.targetId :
                       edge.targetId === personId ? edge.sourceId : null;
      if (!spouseId) continue;

      // Check if marriage existed at this event
      if (edge.introducedSliceIndex > event.sliceIndex) continue;

      if (edge.introducedSliceIndex === event.sliceIndex) {
        // Same slice - check event ordering
        const marriageEvent = this.findEvent({ type: 'addEdge', edgeId: edge.id });
        if (marriageEvent && marriageEvent.eventIndex >= event.eventIndex) continue;
      }

      // Check if spouse was alive
      if (!this.wasAliveWhen(spouseId, event)) continue;

      const spouse = state.nodes.get(spouseId);
      if (spouse) spouses.push(spouse);
    }

    return spouses;
  }

  /**
   * Check if a person had living children at the moment of a specific event.
   */
  hadLivingChildrenWhen(personId: string, event: EventRef): boolean {
    const children = this.getLivingChildrenWhen(personId, event);
    return children.length > 0;
  }

  /**
   * Get living children of a person at the moment of a specific event.
   */
  getLivingChildrenWhen(personId: string, event: EventRef): Person[] {
    const state = this.getStateAtSlice(event.sliceIndex);
    if (!state) return [];

    const livingChildren: Person[] = [];

    for (const edge of state.edges.values()) {
      if (edge.type === 'parent-child' && edge.sourceId === personId) {
        const child = state.nodes.get(edge.targetId);
        if (child && this.wasAliveWhen(child.id, event)) {
          livingChildren.push(child);
        }
      }
    }

    return livingChildren;
  }

  /**
   * Get the relationship between two people at the moment of a specific event.
   */
  getRelationshipWhen(personA: string, personB: string, event: EventRef): Relationship | null {
    const state = this.getStateAtSlice(event.sliceIndex);
    if (!state) return null;

    for (const edge of state.edges.values()) {
      if ((edge.sourceId === personA && edge.targetId === personB) ||
          (edge.sourceId === personB && edge.targetId === personA)) {

        // Check if relationship existed at this event
        if (edge.introducedSliceIndex > event.sliceIndex) continue;

        if (edge.introducedSliceIndex === event.sliceIndex) {
          const addEvent = this.findEvent({ type: 'addEdge', edgeId: edge.id });
          if (addEvent && addEvent.eventIndex >= event.eventIndex) continue;
        }

        return edge;
      }
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFETIME OVERLAP QUERIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if two people's lifetimes overlapped at any point.
   */
  lifetimesOverlap(personA: string, personB: string): boolean {
    const a = this.graph.nodes[personA];
    const b = this.graph.nodes[personB];
    if (!a || !b) return false;

    // A's lifetime: [a.introducedSliceIndex, a.deathSliceIndex or Infinity]
    // B's lifetime: [b.introducedSliceIndex, b.deathSliceIndex or Infinity]
    // They overlap if: max(a.start, b.start) < min(a.end, b.end)

    const aEnd = a.deathSliceIndex ?? Infinity;
    const bEnd = b.deathSliceIndex ?? Infinity;

    const overlapStart = Math.max(a.introducedSliceIndex, b.introducedSliceIndex);
    const overlapEnd = Math.min(aEnd, bEnd);

    return overlapStart < overlapEnd;
  }

  /**
   * Check if person A was alive during person B's lifetime.
   * (A lived at some point while B was alive)
   */
  wasAliveDuringLifetime(personId: string, duringWhoseLifetime: string): boolean {
    return this.lifetimesOverlap(personId, duringWhoseLifetime);
  }

  /**
   * Check if a person was alive during the period from startEvent to endEvent.
   */
  wasAliveDuring(personId: string, startEvent: EventRef, endEvent: EventRef): boolean {
    const person = this.graph.nodes[personId];
    if (!person) return false;

    // Person must be alive at start
    if (!this.wasAliveWhen(personId, startEvent)) return false;

    // Check if person died before the end
    if (person.deathSliceIndex === undefined) return true;

    if (person.deathSliceIndex > endEvent.sliceIndex) return true;
    if (person.deathSliceIndex < endEvent.sliceIndex) return false;

    // Same slice - check event ordering
    const deathEvent = this.findDeathEvent(personId);
    if (!deathEvent) return true;

    return endEvent.eventIndex <= deathEvent.eventIndex;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT ORDERING QUERIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Compare two events and determine their order.
   */
  eventOrder(event1: EventRef, event2: EventRef): 'before' | 'after' | 'same' {
    if (event1.sliceIndex < event2.sliceIndex) return 'before';
    if (event1.sliceIndex > event2.sliceIndex) return 'after';

    if (event1.eventIndex < event2.eventIndex) return 'before';
    if (event1.eventIndex > event2.eventIndex) return 'after';

    return 'same';
  }

  /**
   * Check if event1 happened before event2.
   */
  happenedBefore(event1: EventIdentifier, event2: EventIdentifier): boolean | null {
    const ref1 = this.findEvent(event1);
    const ref2 = this.findEvent(event2);

    if (!ref1 || !ref2) return null;

    return this.eventOrder(ref1, ref2) === 'before';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RELATIONSHIP TIMING QUERIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if a relationship existed at the moment of a specific event.
   */
  relationshipExistedWhen(
    personA: string,
    personB: string,
    type: RelationshipType,
    event: EventRef
  ): boolean {
    const rel = this.getRelationshipWhen(personA, personB, event);
    return rel !== null && rel.type === type;
  }

  /**
   * Get when a relationship started and ended.
   */
  getRelationshipTiming(edgeId: string): { started: EventRef; ended?: EventRef } | null {
    const edge = this.graph.edges[edgeId];
    if (!edge) return null;

    const started = this.findEvent({ type: 'addEdge', edgeId });
    if (!started) {
      // Edge exists but no addEdge event found - use introducedSliceIndex
      return {
        started: { sliceIndex: edge.introducedSliceIndex, eventIndex: 0 },
      };
    }

    // Check for removal or update to divorce/chalitzah
    let ended: EventRef | undefined;

    for (let sliceIndex = started.sliceIndex; sliceIndex < this.graph.slices.length; sliceIndex++) {
      const slice = this.graph.slices[sliceIndex];
      for (let eventIndex = 0; eventIndex < slice.events.length; eventIndex++) {
        if (sliceIndex === started.sliceIndex && eventIndex <= started.eventIndex) continue;

        const event = slice.events[eventIndex];
        if (event.type === 'removeEdge' && event.edgeId === edgeId) {
          ended = { sliceIndex, eventIndex };
          break;
        }
        if (event.type === 'updateEdge' && event.edgeId === edgeId) {
          if (event.changes.type === 'divorce' || event.changes.type === 'chalitzah') {
            ended = { sliceIndex, eventIndex };
            break;
          }
        }
      }
      if (ended) break;
    }

    return { started, ended };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATH FINDING (for derived relationships like "brother's wife")
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Find a relationship path between two people.
   * Uses BFS to find the shortest path.
   */
  findRelationshipPath(personA: string, personB: string, sliceIndex: number): RelationshipPath | null {
    if (personA === personB) return null;

    const state = this.getStateAtSlice(sliceIndex);
    if (!state) return null;

    // BFS to find shortest path
    const visited = new Set<string>();
    const queue: { personId: string; path: PathStep[] }[] = [
      { personId: personA, path: [] }
    ];

    while (queue.length > 0) {
      const { personId, path } = queue.shift()!;

      if (visited.has(personId)) continue;
      visited.add(personId);

      // Check neighbors
      const neighbors = this.getNeighborsWithRelationType(personId, sliceIndex);

      for (const { neighborId, relationship, edgeId } of neighbors) {
        if (neighborId === personB) {
          // Found target
          const finalPath: PathStep[] = [
            ...path,
            { fromPerson: personId, toPerson: neighborId, relationship, edgeId }
          ];
          return {
            steps: finalPath,
            description: this.describeRelationshipPath(finalPath),
          };
        }

        if (!visited.has(neighborId)) {
          queue.push({
            personId: neighborId,
            path: [
              ...path,
              { fromPerson: personId, toPerson: neighborId, relationship, edgeId }
            ]
          });
        }
      }
    }

    return null;
  }

  /**
   * Get all neighbors of a person with their relationship type.
   */
  private getNeighborsWithRelationType(
    personId: string,
    sliceIndex: number
  ): { neighborId: string; relationship: PathStep['relationship']; edgeId: string }[] {
    const result: { neighborId: string; relationship: PathStep['relationship']; edgeId: string }[] = [];
    const state = this.getStateAtSlice(sliceIndex);
    if (!state) return result;

    for (const edge of state.edges.values()) {
      let neighborId: string | null = null;
      let relationship: PathStep['relationship'] | null = null;

      if (edge.sourceId === personId) {
        neighborId = edge.targetId;
      } else if (edge.targetId === personId) {
        neighborId = edge.sourceId;
      }

      if (!neighborId) continue;

      // Map edge type to relationship
      switch (edge.type) {
        case 'parent-child':
          relationship = edge.sourceId === personId ? 'child' : 'parent';
          break;
        case 'sibling':
          relationship = 'sibling';
          break;
        case 'erusin':
        case 'nisuin':
          relationship = 'spouse';
          break;
        case 'yibum':
          relationship = edge.sourceId === personId ? 'yevama' : 'yavam';
          break;
        default:
          continue; // Skip other relationship types
      }

      if (relationship) {
        result.push({ neighborId, relationship, edgeId: edge.id });
      }
    }

    return result;
  }

  /**
   * Generate a human-readable description of a relationship path.
   */
  private describeRelationshipPath(steps: PathStep[]): { en: string; he: string } {
    if (steps.length === 0) return { en: '', he: '' };

    const descriptions: { en: string[]; he: string[] } = { en: [], he: [] };

    for (const step of steps) {
      switch (step.relationship) {
        case 'parent':
          descriptions.en.push('parent');
          descriptions.he.push('הורה');
          break;
        case 'child':
          descriptions.en.push('child');
          descriptions.he.push('ילד');
          break;
        case 'sibling':
          descriptions.en.push('sibling');
          descriptions.he.push('אח');
          break;
        case 'spouse':
          descriptions.en.push('spouse');
          descriptions.he.push('בן/בת זוג');
          break;
        case 'yavam':
          descriptions.en.push('yavam');
          descriptions.he.push('יבם');
          break;
        case 'yevama':
          descriptions.en.push('yevama');
          descriptions.he.push('יבמה');
          break;
      }
    }

    // Combine into readable format
    // e.g., ["sibling", "spouse"] -> "Sibling's spouse" / "בן/בת זוג של אח"
    if (descriptions.en.length === 1) {
      return {
        en: capitalize(descriptions.en[0]),
        he: descriptions.he[0],
      };
    }

    // Build possessive chain
    const en = descriptions.en
      .map((d, i) => i === descriptions.en.length - 1 ? d : `${d}'s`)
      .join(' ');

    const he = descriptions.he.reverse().join(' של ');

    return {
      en: capitalize(en),
      he,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════════════════════════════════════

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// Factory function for creating query engine
// ═══════════════════════════════════════════════════════════════════════════

export function createGraphQueryEngine(
  graph: TemporalGraph,
  resolvedStates?: ResolvedGraphState[]
): GraphQueryEngine {
  return new GraphQueryEngine(graph, resolvedStates);
}
