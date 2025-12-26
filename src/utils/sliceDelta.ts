import { ResolvedGraphState } from '@/types';
import { SliceChanges } from '@/store/graphStore';

/**
 * Compute the changes between two resolved graph states.
 * Used to highlight what changed during slice transitions.
 */
export function computeSliceChanges(
  prevState: ResolvedGraphState | undefined,
  currentState: ResolvedGraphState,
  prevSliceIndex: number,
  currentSliceIndex: number
): SliceChanges {
  const result: SliceChanges = {
    newNodes: [],
    deadNodes: [],
    newEdges: [],
  };

  if (!prevState) {
    // First slice - all nodes/edges are "new"
    result.newNodes = Array.from(currentState.nodes.keys());
    result.newEdges = Array.from(currentState.edges.keys());
    return result;
  }

  // Find new nodes (nodes that exist in current but not in prev)
  for (const [id] of currentState.nodes) {
    if (!prevState.nodes.has(id)) {
      result.newNodes.push(id);
    }
  }

  // Find newly dead nodes (nodes that died between prev and current slice)
  for (const [id, node] of currentState.nodes) {
    const prevNode = prevState.nodes.get(id);
    if (prevNode) {
      const wasDead = prevNode.deathSliceIndex !== undefined &&
                      prevNode.deathSliceIndex <= prevSliceIndex;
      const isDead = node.deathSliceIndex !== undefined &&
                     node.deathSliceIndex <= currentSliceIndex;
      if (!wasDead && isDead) {
        result.deadNodes.push(id);
      }
    }
  }

  // Find new edges (edges that exist in current but not in prev)
  for (const [id] of currentState.edges) {
    if (!prevState.edges.has(id)) {
      result.newEdges.push(id);
    }
  }

  return result;
}

/**
 * Check if a node ID is in the highlighted new nodes
 */
export function isNodeHighlightedAsNew(
  nodeId: string,
  highlightedChanges: SliceChanges
): boolean {
  return highlightedChanges.newNodes.includes(nodeId);
}

/**
 * Check if a node ID is in the highlighted dead nodes
 */
export function isNodeHighlightedAsDead(
  nodeId: string,
  highlightedChanges: SliceChanges
): boolean {
  return highlightedChanges.deadNodes.includes(nodeId);
}

/**
 * Check if an edge ID is in the highlighted new edges
 */
export function isEdgeHighlightedAsNew(
  edgeId: string,
  highlightedChanges: SliceChanges
): boolean {
  return highlightedChanges.newEdges.includes(edgeId);
}
