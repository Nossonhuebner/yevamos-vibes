import { DeltaOperation, Person, Relationship, ResolvedGraphState, TimeSlice } from '@/types';

/**
 * Apply a single delta operation to a graph state
 */
function applyDelta(state: ResolvedGraphState, delta: DeltaOperation): void {
  switch (delta.op) {
    case 'addNode':
      state.nodes.set(delta.node.id, { ...delta.node });
      break;
    case 'removeNode':
      state.nodes.delete(delta.nodeId);
      // Also remove any edges connected to this node
      for (const [edgeId, edge] of state.edges) {
        if (edge.sourceId === delta.nodeId || edge.targetId === delta.nodeId) {
          state.edges.delete(edgeId);
        }
      }
      break;
    case 'updateNode': {
      const node = state.nodes.get(delta.nodeId);
      if (node) {
        state.nodes.set(delta.nodeId, { ...node, ...delta.changes });
      }
      break;
    }
    case 'markDead': {
      const node = state.nodes.get(delta.nodeId);
      if (node) {
        state.nodes.set(delta.nodeId, { ...node, deathSliceIndex: delta.sliceIndex });
      }
      break;
    }
    case 'addEdge':
      state.edges.set(delta.edge.id, { ...delta.edge });
      break;
    case 'removeEdge':
      state.edges.delete(delta.edgeId);
      break;
    case 'updateEdge': {
      const edge = state.edges.get(delta.edgeId);
      if (edge) {
        state.edges.set(delta.edgeId, { ...edge, ...delta.changes });
      }
      break;
    }
  }
}

/**
 * Resolve the graph state at a given slice index by applying all deltas
 * from slice 0 up to and including the target slice
 */
export function resolveGraphAtSlice(slices: TimeSlice[], targetIndex: number): ResolvedGraphState {
  const state: ResolvedGraphState = {
    nodes: new Map(),
    edges: new Map(),
  };

  // Apply all deltas from slice 0 to targetIndex
  for (let i = 0; i <= Math.min(targetIndex, slices.length - 1); i++) {
    const slice = slices[i];
    for (const delta of slice.deltas) {
      applyDelta(state, delta);
    }
  }

  return state;
}

/**
 * Resolve graph states for all slices (useful for 3D view)
 */
export function resolveAllSlices(slices: TimeSlice[]): ResolvedGraphState[] {
  const results: ResolvedGraphState[] = [];
  const state: ResolvedGraphState = {
    nodes: new Map(),
    edges: new Map(),
  };

  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i];
    for (const delta of slice.deltas) {
      applyDelta(state, delta);
    }
    // Deep clone the current state
    results.push({
      nodes: new Map(Array.from(state.nodes).map(([k, v]) => [k, { ...v }])),
      edges: new Map(Array.from(state.edges).map(([k, v]) => [k, { ...v }])),
    });
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
 * Create a position update delta that will propagate to subsequent slices
 */
export function createPositionUpdateDelta(
  nodeId: string,
  position: { x: number; y: number }
): DeltaOperation {
  return {
    op: 'updateNode',
    nodeId,
    changes: { position },
  };
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
