import { Person, Relationship, ResolvedGraphState, TemporalGraph } from '@/types';

/**
 * Resolve the graph state at a given slice index.
 *
 * The new model is simpler:
 * - Nodes exist in graph.nodes with their static properties
 * - Edges exist in graph.edges with their base properties
 * - Events in slices track: when nodes appear, when they die, when edges are added/modified
 *
 * To resolve state at slice N:
 * 1. Include all nodes with introducedSliceIndex <= N
 * 2. Include all edges with introducedSliceIndex <= N
 * 3. Apply any edge updates from events up to slice N
 */
export function resolveGraphAtSlice(graph: TemporalGraph, targetIndex: number): ResolvedGraphState {
  const state: ResolvedGraphState = {
    nodes: new Map(),
    edges: new Map(),
  };

  // Add all nodes that have been introduced by this slice
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (node.introducedSliceIndex <= targetIndex) {
      state.nodes.set(id, { ...node });
    }
  }

  // Add all edges that have been introduced by this slice
  for (const [id, edge] of Object.entries(graph.edges)) {
    if (edge.introducedSliceIndex <= targetIndex) {
      state.edges.set(id, { ...edge });
    }
  }

  // Apply edge updates from events up to targetIndex
  for (let i = 0; i <= Math.min(targetIndex, graph.slices.length - 1); i++) {
    const slice = graph.slices[i];
    for (const event of slice.events) {
      if (event.type === 'updateEdge') {
        const edge = state.edges.get(event.edgeId);
        if (edge) {
          state.edges.set(event.edgeId, { ...edge, ...event.changes });
        }
      } else if (event.type === 'removeEdge') {
        state.edges.delete(event.edgeId);
      }
    }
  }

  return state;
}

/**
 * Resolve graph states for all slices (useful for 3D view)
 */
export function resolveAllSlices(graph: TemporalGraph): ResolvedGraphState[] {
  const results: ResolvedGraphState[] = [];

  for (let i = 0; i < graph.slices.length; i++) {
    results.push(resolveGraphAtSlice(graph, i));
  }

  return results;
}

/**
 * Get nodes that exist in a slice (for rendering)
 */
export function getNodesArray(state: ResolvedGraphState): Person[] {
  return Array.from(state.nodes.values());
}

/**
 * Get edges that exist in a slice (for rendering)
 */
export function getEdgesArray(state: ResolvedGraphState): Relationship[] {
  return Array.from(state.edges.values());
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a person is dead at a given slice index
 */
export function isPersonDead(person: Person, currentSliceIndex: number): boolean {
  return person.deathSliceIndex !== undefined && person.deathSliceIndex <= currentSliceIndex;
}

/**
 * Find a position that avoids collision with other nodes
 */
export function findNonCollidingPosition(
  targetPosition: { x: number; y: number },
  nodeId: string,
  allNodes: Person[],
  minDistance: number = 1.2
): { x: number; y: number } {
  const otherNodes = allNodes.filter((n) => n.id !== nodeId);

  // Check if current position collides
  const hasCollision = (pos: { x: number; y: number }) => {
    return otherNodes.some((node) => {
      const dx = node.position.x - pos.x;
      const dy = node.position.y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < minDistance;
    });
  };

  if (!hasCollision(targetPosition)) {
    return targetPosition;
  }

  // Find nearest non-colliding position by spiraling outward
  const spiralStep = 0.3;
  let angle = 0;
  let radius = spiralStep;

  for (let i = 0; i < 100; i++) {
    const testPos = {
      x: targetPosition.x + Math.cos(angle) * radius,
      y: targetPosition.y + Math.sin(angle) * radius,
    };

    if (!hasCollision(testPos)) {
      return testPos;
    }

    angle += Math.PI / 4;
    if (angle >= Math.PI * 2) {
      angle = 0;
      radius += spiralStep;
    }
  }

  // Fallback: return position offset by minDistance
  return {
    x: targetPosition.x + minDistance,
    y: targetPosition.y,
  };
}
