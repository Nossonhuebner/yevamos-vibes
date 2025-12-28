/**
 * Event Resolver Utilities
 *
 * Additional utilities for resolving and comparing temporal events.
 * Works alongside graphQueries.ts for complex temporal reasoning.
 */

import { TemporalGraph, TemporalEvent, TimeSlice } from '@/types';
import { EventRef } from './graphQueries';

// ═══════════════════════════════════════════════════════════════════════════
// Event Timeline Builder
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Represents an event with its full context.
 */
export interface ResolvedEvent {
  ref: EventRef;
  event: TemporalEvent;
  slice: TimeSlice;
}

/**
 * Build a complete timeline of all events in the graph.
 */
export function buildEventTimeline(graph: TemporalGraph): ResolvedEvent[] {
  const timeline: ResolvedEvent[] = [];

  for (let sliceIndex = 0; sliceIndex < graph.slices.length; sliceIndex++) {
    const slice = graph.slices[sliceIndex];
    for (let eventIndex = 0; eventIndex < slice.events.length; eventIndex++) {
      timeline.push({
        ref: { sliceIndex, eventIndex },
        event: slice.events[eventIndex],
        slice,
      });
    }
  }

  return timeline;
}

/**
 * Get all events of a specific type.
 */
export function getEventsByType(
  graph: TemporalGraph,
  type: TemporalEvent['type']
): ResolvedEvent[] {
  const timeline = buildEventTimeline(graph);
  return timeline.filter(e => e.event.type === type);
}

/**
 * Get all events involving a specific person.
 */
export function getEventsForPerson(
  graph: TemporalGraph,
  personId: string
): ResolvedEvent[] {
  const timeline = buildEventTimeline(graph);
  return timeline.filter(e => {
    if (e.event.type === 'addNode' || e.event.type === 'death') {
      return e.event.nodeId === personId;
    }
    if (e.event.type === 'addEdge' || e.event.type === 'updateEdge' || e.event.type === 'removeEdge') {
      const edge = graph.edges[e.event.edgeId];
      return edge && (edge.sourceId === personId || edge.targetId === personId);
    }
    return false;
  });
}

/**
 * Get all events involving a specific edge.
 */
export function getEventsForEdge(
  graph: TemporalGraph,
  edgeId: string
): ResolvedEvent[] {
  const timeline = buildEventTimeline(graph);
  return timeline.filter(e => {
    if (e.event.type === 'addEdge' || e.event.type === 'updateEdge' || e.event.type === 'removeEdge') {
      return e.event.edgeId === edgeId;
    }
    return false;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Temporal Comparison Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compare two EventRefs.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
export function compareEventRefs(a: EventRef, b: EventRef): number {
  if (a.sliceIndex !== b.sliceIndex) {
    return a.sliceIndex - b.sliceIndex;
  }
  return a.eventIndex - b.eventIndex;
}

/**
 * Check if event A is strictly before event B.
 */
export function isBefore(a: EventRef, b: EventRef): boolean {
  return compareEventRefs(a, b) < 0;
}

/**
 * Check if event A is strictly after event B.
 */
export function isAfter(a: EventRef, b: EventRef): boolean {
  return compareEventRefs(a, b) > 0;
}

/**
 * Check if event A is at the same time as event B.
 */
export function isSameTime(a: EventRef, b: EventRef): boolean {
  return compareEventRefs(a, b) === 0;
}

/**
 * Check if event A is before or at the same time as event B.
 */
export function isBeforeOrSame(a: EventRef, b: EventRef): boolean {
  return compareEventRefs(a, b) <= 0;
}

/**
 * Check if event A is after or at the same time as event B.
 */
export function isAfterOrSame(a: EventRef, b: EventRef): boolean {
  return compareEventRefs(a, b) >= 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// Lifetime Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Represents a person's lifetime as EventRefs.
 */
export interface Lifetime {
  personId: string;
  birth: EventRef;
  death?: EventRef;
}

/**
 * Get the lifetime of a person as EventRefs.
 */
export function getPersonLifetime(graph: TemporalGraph, personId: string): Lifetime | null {
  const person = graph.nodes[personId];
  if (!person) return null;

  // Find birth event
  let birth: EventRef | null = null;
  for (let sliceIndex = 0; sliceIndex < graph.slices.length; sliceIndex++) {
    const slice = graph.slices[sliceIndex];
    for (let eventIndex = 0; eventIndex < slice.events.length; eventIndex++) {
      const event = slice.events[eventIndex];
      if (event.type === 'addNode' && event.nodeId === personId) {
        birth = { sliceIndex, eventIndex };
        break;
      }
    }
    if (birth) break;
  }

  if (!birth) {
    // Use introducedSliceIndex as fallback
    birth = { sliceIndex: person.introducedSliceIndex, eventIndex: 0 };
  }

  // Find death event
  let death: EventRef | undefined;
  if (person.deathSliceIndex !== undefined) {
    for (let sliceIndex = person.deathSliceIndex; sliceIndex < graph.slices.length; sliceIndex++) {
      const slice = graph.slices[sliceIndex];
      for (let eventIndex = 0; eventIndex < slice.events.length; eventIndex++) {
        const event = slice.events[eventIndex];
        if (event.type === 'death' && event.nodeId === personId) {
          death = { sliceIndex, eventIndex };
          break;
        }
      }
      if (death) break;
    }
  }

  return { personId, birth, death };
}

/**
 * Check if two lifetimes overlap.
 */
export function lifetimesOverlap(a: Lifetime, b: Lifetime): boolean {
  // A's end (if no death, use infinity represented by very large values)
  const aEnd = a.death || { sliceIndex: Number.MAX_SAFE_INTEGER, eventIndex: 0 };
  const bEnd = b.death || { sliceIndex: Number.MAX_SAFE_INTEGER, eventIndex: 0 };

  // Overlap if: a.birth < b.end AND b.birth < a.end
  return isBefore(a.birth, bEnd) && isBefore(b.birth, aEnd);
}

/**
 * Check if event is during a person's lifetime.
 */
export function isDuringLifetime(event: EventRef, lifetime: Lifetime): boolean {
  // Event must be at or after birth
  if (isBefore(event, lifetime.birth)) return false;

  // If no death, person is still alive
  if (!lifetime.death) return true;

  // Event must be before death
  return isBefore(event, lifetime.death);
}

// ═══════════════════════════════════════════════════════════════════════════
// Relationship Lifetime Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Represents a relationship's lifetime as EventRefs.
 */
export interface RelationshipLifetime {
  edgeId: string;
  created: EventRef;
  ended?: EventRef;
  endReason?: 'removed' | 'divorce' | 'chalitzah' | 'death';
}

/**
 * Get the lifetime of a relationship.
 */
export function getRelationshipLifetime(
  graph: TemporalGraph,
  edgeId: string
): RelationshipLifetime | null {
  const edge = graph.edges[edgeId];
  if (!edge) return null;

  // Find creation event
  let created: EventRef | null = null;
  for (let sliceIndex = 0; sliceIndex < graph.slices.length; sliceIndex++) {
    const slice = graph.slices[sliceIndex];
    for (let eventIndex = 0; eventIndex < slice.events.length; eventIndex++) {
      const event = slice.events[eventIndex];
      if (event.type === 'addEdge' && event.edgeId === edgeId) {
        created = { sliceIndex, eventIndex };
        break;
      }
    }
    if (created) break;
  }

  if (!created) {
    created = { sliceIndex: edge.introducedSliceIndex, eventIndex: 0 };
  }

  // Find end event
  let ended: EventRef | undefined;
  let endReason: RelationshipLifetime['endReason'];

  for (let sliceIndex = created.sliceIndex; sliceIndex < graph.slices.length; sliceIndex++) {
    const slice = graph.slices[sliceIndex];
    for (let eventIndex = 0; eventIndex < slice.events.length; eventIndex++) {
      if (sliceIndex === created.sliceIndex && eventIndex <= created.eventIndex) continue;

      const event = slice.events[eventIndex];

      if (event.type === 'removeEdge' && event.edgeId === edgeId) {
        ended = { sliceIndex, eventIndex };
        endReason = 'removed';
        break;
      }

      if (event.type === 'updateEdge' && event.edgeId === edgeId) {
        if (event.changes.type === 'divorce') {
          ended = { sliceIndex, eventIndex };
          endReason = 'divorce';
          break;
        }
        if (event.changes.type === 'chalitzah') {
          ended = { sliceIndex, eventIndex };
          endReason = 'chalitzah';
          break;
        }
      }

      // Check for death of either party ending the relationship
      if (event.type === 'death') {
        if (event.nodeId === edge.sourceId || event.nodeId === edge.targetId) {
          ended = { sliceIndex, eventIndex };
          endReason = 'death';
          break;
        }
      }
    }
    if (ended) break;
  }

  return { edgeId, created, ended, endReason };
}

/**
 * Check if a relationship was active at a specific event.
 */
export function wasRelationshipActiveAt(
  lifetime: RelationshipLifetime,
  event: EventRef
): boolean {
  // Must be at or after creation
  if (isBefore(event, lifetime.created)) return false;

  // If no end, relationship is still active
  if (!lifetime.ended) return true;

  // Must be before end
  return isBefore(event, lifetime.ended);
}

// ═══════════════════════════════════════════════════════════════════════════
// State at Event Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the set of people who were alive at a specific event.
 */
export function getAliveAtEvent(graph: TemporalGraph, event: EventRef): Set<string> {
  const alive = new Set<string>();

  for (const [personId] of Object.entries(graph.nodes)) {
    const lifetime = getPersonLifetime(graph, personId);
    if (lifetime && isDuringLifetime(event, lifetime)) {
      alive.add(personId);
    }
  }

  return alive;
}

/**
 * Get the set of active relationships at a specific event.
 */
export function getActiveRelationshipsAtEvent(
  graph: TemporalGraph,
  event: EventRef
): Set<string> {
  const active = new Set<string>();

  for (const edgeId of Object.keys(graph.edges)) {
    const lifetime = getRelationshipLifetime(graph, edgeId);
    if (lifetime && wasRelationshipActiveAt(lifetime, event)) {
      active.add(edgeId);
    }
  }

  return active;
}
