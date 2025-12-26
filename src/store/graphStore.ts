import { create } from 'zustand';
import { DeltaOperation, Person, Relationship, ResolvedGraphState, TemporalGraph, TimeSlice, getRandomNodeColor } from '@/types';
import { generateId, resolveAllSlices } from '@/utils/deltaResolver';
import { Language } from '@/i18n/translations';

// Context menu types
export type ContextMenuType =
  | { type: 'slice'; sliceIndex: number; position3D: { x: number; y: number } }
  | { type: 'person'; personId: string }
  | { type: 'edge'; edgeId: string }
  | null;

// Selection box state for drag-to-select
interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// Persistent selection bounds (screen coordinates) - shown after selection is made
interface SelectionBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Selection drag state - for moving selected nodes via the selection handle
interface SelectionDragState {
  startScreenX: number;
  startScreenY: number;
  initialPositions: Map<string, { x: number; y: number }>;
}

// Walkthrough/Slideshow types
export type ViewMode = 'overview' | 'focus';
export type PlaybackSpeed = 'slow' | 'medium' | 'fast';

export const PLAYBACK_SPEED_MS: Record<PlaybackSpeed, number> = {
  slow: 3000,
  medium: 2000,
  fast: 1000,
};

// Slice changes detected during transitions
export interface SliceChanges {
  newNodes: string[];
  deadNodes: string[];
  newEdges: string[];
}

interface GraphStore {
  // State
  graph: TemporalGraph;
  currentSliceIndex: number;
  selectedNodeIds: string[]; // Support multi-select (unlimited)
  selectedEdgeId: string | null;
  isDraggingNode: boolean; // True when a node is being dragged
  selectionBox: SelectionBox | null; // Active selection rectangle (during drag)
  selectionBounds: SelectionBounds | null; // Persistent bounds around selected nodes
  isDraggingSelection: boolean; // True when dragging the selection box handle
  selectionDragState: SelectionDragState | null; // Tracks drag start position and initial node positions

  // Walkthrough/Slideshow state
  viewMode: ViewMode;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  highlightedChanges: SliceChanges; // Changes to highlight during transition

  // Context menu
  contextMenu: { target: ContextMenuType; screenX: number; screenY: number } | null;

  // Language
  language: Language;

  // Computed (cached)
  resolvedStates: ResolvedGraphState[];

  // Slice actions
  setCurrentSlice: (index: number) => void;
  addSlice: (label: string, afterIndex?: number) => void;
  removeSlice: (index: number) => void;
  updateSliceLabel: (index: number, label: string) => void;

  // Delta actions
  addDelta: (sliceIndex: number, delta: DeltaOperation) => void;
  removeDelta: (sliceIndex: number, deltaIndex: number) => void;

  // Convenience actions for common operations
  addPerson: (person: Omit<Person, 'id' | 'deathSliceIndex' | 'color'>) => string;
  markPersonDead: (nodeId: string) => void; // Mark as dead at current slice
  purgePerson: (nodeId: string) => void; // Remove from ALL slices entirely
  updatePersonPosition: (nodeId: string, position: { x: number; y: number }) => void;
  updateMultiplePositions: (updates: { nodeId: string; position: { x: number; y: number } }[]) => void;
  updatePersonName: (nodeId: string, name: string) => void;

  addRelationship: (relationship: Omit<Relationship, 'id'>) => string;
  removeRelationship: (edgeId: string) => void;
  updateRelationship: (edgeId: string, changes: Partial<Omit<Relationship, 'id'>>) => void;
  addChildToRelationship: (edgeId: string, child: Omit<Person, 'id' | 'deathSliceIndex' | 'color'>) => string | null;

  // Selection
  toggleNodeSelection: (nodeId: string) => void;
  setSelectedNodes: (nodeIds: string[]) => void;
  clearNodeSelection: () => void;
  selectEdge: (edgeId: string | null) => void;
  setIsDraggingNode: (isDragging: boolean) => void;

  // Selection box
  startSelectionBox: (x: number, y: number) => void;
  updateSelectionBox: (x: number, y: number) => void;
  finishSelectionBox: () => void;
  cancelSelectionBox: () => void;

  // Selection bounds (persistent box around selected nodes)
  setSelectionBounds: (bounds: SelectionBounds | null) => void;
  startDraggingSelection: (screenX: number, screenY: number, initialPositions: Map<string, { x: number; y: number }>) => void;
  stopDraggingSelection: () => void;

  // Context menu
  openContextMenu: (target: ContextMenuType, screenX: number, screenY: number) => void;
  closeContextMenu: () => void;

  // Persistence
  loadGraph: (graph: TemporalGraph) => void;
  resetGraph: () => void;

  // Metadata
  updateMetadata: (metadata: Partial<TemporalGraph['metadata']>) => void;

  // Walkthrough/Slideshow actions
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setHighlightedChanges: (changes: SliceChanges) => void;
  clearHighlightedChanges: () => void;

  // Language
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

const createInitialGraph = (): TemporalGraph => ({
  slices: [
    {
      id: generateId(),
      label: 'Initial State',
      deltas: [],
    },
  ],
  metadata: {
    title: 'Untitled Graph',
    description: '',
  },
});

const recomputeResolvedStates = (slices: TimeSlice[]): ResolvedGraphState[] => {
  return resolveAllSlices(slices);
};

export const useGraphStore = create<GraphStore>((set, get) => ({
  graph: createInitialGraph(),
  currentSliceIndex: 0,
  selectedNodeIds: [],
  selectedEdgeId: null,
  isDraggingNode: false,
  selectionBox: null,
  selectionBounds: null,
  isDraggingSelection: false,
  selectionDragState: null,
  contextMenu: null,
  resolvedStates: [{ nodes: new Map(), edges: new Map() }],

  // Walkthrough/Slideshow state
  viewMode: 'overview',
  isPlaying: false,
  playbackSpeed: 'medium',
  highlightedChanges: { newNodes: [], deadNodes: [], newEdges: [] },

  // Language
  language: 'en',

  setCurrentSlice: (index) => {
    const { graph } = get();
    if (index >= 0 && index < graph.slices.length) {
      set({ currentSliceIndex: index });
    }
  },

  addSlice: (label, afterIndex) => {
    set((state) => {
      const insertIndex = afterIndex !== undefined ? afterIndex + 1 : state.graph.slices.length;
      const newSlice: TimeSlice = {
        id: generateId(),
        label,
        deltas: [],
      };
      const newSlices = [...state.graph.slices];
      newSlices.splice(insertIndex, 0, newSlice);

      return {
        graph: { ...state.graph, slices: newSlices },
        resolvedStates: recomputeResolvedStates(newSlices),
        currentSliceIndex: insertIndex,
      };
    });
  },

  removeSlice: (index) => {
    set((state) => {
      if (state.graph.slices.length <= 1) return state; // Keep at least one slice
      const newSlices = state.graph.slices.filter((_, i) => i !== index);
      const newIndex = Math.min(state.currentSliceIndex, newSlices.length - 1);

      return {
        graph: { ...state.graph, slices: newSlices },
        resolvedStates: recomputeResolvedStates(newSlices),
        currentSliceIndex: newIndex,
      };
    });
  },

  updateSliceLabel: (index, label) => {
    set((state) => {
      const newSlices = [...state.graph.slices];
      if (newSlices[index]) {
        newSlices[index] = { ...newSlices[index], label };
      }
      return { graph: { ...state.graph, slices: newSlices } };
    });
  },

  addDelta: (sliceIndex, delta) => {
    set((state) => {
      const newSlices = [...state.graph.slices];
      if (newSlices[sliceIndex]) {
        newSlices[sliceIndex] = {
          ...newSlices[sliceIndex],
          deltas: [...newSlices[sliceIndex].deltas, delta],
        };
      }
      return {
        graph: { ...state.graph, slices: newSlices },
        resolvedStates: recomputeResolvedStates(newSlices),
      };
    });
  },

  removeDelta: (sliceIndex, deltaIndex) => {
    set((state) => {
      const newSlices = [...state.graph.slices];
      if (newSlices[sliceIndex]) {
        const newDeltas = [...newSlices[sliceIndex].deltas];
        newDeltas.splice(deltaIndex, 1);
        newSlices[sliceIndex] = { ...newSlices[sliceIndex], deltas: newDeltas };
      }
      return {
        graph: { ...state.graph, slices: newSlices },
        resolvedStates: recomputeResolvedStates(newSlices),
      };
    });
  },

  addPerson: (person) => {
    const id = generateId();
    const color = getRandomNodeColor();
    const { currentSliceIndex, addDelta } = get();
    addDelta(currentSliceIndex, {
      op: 'addNode',
      node: { ...person, id, color },
    });
    return id;
  },

  markPersonDead: (nodeId) => {
    const { currentSliceIndex, addDelta } = get();
    addDelta(currentSliceIndex, { op: 'markDead', nodeId, sliceIndex: currentSliceIndex });
  },

  purgePerson: (nodeId) => {
    // Remove the person and their edges from ALL slices
    set((state) => {
      const newSlices = state.graph.slices.map((slice) => {
        // Filter out any deltas that reference this node
        const newDeltas = slice.deltas.filter((delta) => {
          if (delta.op === 'addNode' && delta.node.id === nodeId) return false;
          if (delta.op === 'removeNode' && delta.nodeId === nodeId) return false;
          if (delta.op === 'updateNode' && delta.nodeId === nodeId) return false;
          if (delta.op === 'markDead' && delta.nodeId === nodeId) return false;
          if (delta.op === 'addEdge' && (delta.edge.sourceId === nodeId || delta.edge.targetId === nodeId)) return false;
          if (delta.op === 'removeEdge') {
            // Check if this edge involves the node we're purging
            // We need to look at all slices to find the edge definition
            for (const s of state.graph.slices) {
              for (const d of s.deltas) {
                if (d.op === 'addEdge' && d.edge.id === delta.edgeId) {
                  if (d.edge.sourceId === nodeId || d.edge.targetId === nodeId) {
                    return false;
                  }
                }
              }
            }
          }
          return true;
        });
        return { ...slice, deltas: newDeltas };
      });

      return {
        graph: { ...state.graph, slices: newSlices },
        resolvedStates: recomputeResolvedStates(newSlices),
        selectedNodeIds: state.selectedNodeIds.filter((id) => id !== nodeId),
      };
    });
  },

  updatePersonPosition: (nodeId, position) => {
    // Position updates apply to ALL slices
    set((state) => {
      const newSlices = state.graph.slices.map((slice) => ({
        ...slice,
        deltas: [...slice.deltas, { op: 'updateNode' as const, nodeId, changes: { position } }],
      }));

      return {
        graph: { ...state.graph, slices: newSlices },
        resolvedStates: recomputeResolvedStates(newSlices),
      };
    });
  },

  updateMultiplePositions: (updates: { nodeId: string; position: { x: number; y: number } }[]) => {
    // Batch position updates for multiple nodes (used for group drag)
    set((state) => {
      const newSlices = state.graph.slices.map((slice) => ({
        ...slice,
        deltas: [
          ...slice.deltas,
          ...updates.map(({ nodeId, position }) => ({
            op: 'updateNode' as const,
            nodeId,
            changes: { position },
          })),
        ],
      }));

      return {
        graph: { ...state.graph, slices: newSlices },
        resolvedStates: recomputeResolvedStates(newSlices),
      };
    });
  },

  updatePersonName: (nodeId, name) => {
    const { currentSliceIndex, addDelta } = get();
    addDelta(currentSliceIndex, { op: 'updateNode', nodeId, changes: { name } });
  },

  addRelationship: (relationship) => {
    const id = generateId();
    const { currentSliceIndex, addDelta } = get();
    addDelta(currentSliceIndex, {
      op: 'addEdge',
      edge: { ...relationship, id },
    });
    return id;
  },

  removeRelationship: (edgeId) => {
    // Remove the relationship from ALL slices (similar to purgePerson)
    set((state) => {
      const newSlices = state.graph.slices.map((slice) => {
        // Filter out any deltas that reference this edge
        const newDeltas = slice.deltas.filter((delta) => {
          if (delta.op === 'addEdge' && delta.edge.id === edgeId) return false;
          if (delta.op === 'removeEdge' && delta.edgeId === edgeId) return false;
          if (delta.op === 'updateEdge' && delta.edgeId === edgeId) return false;
          return true;
        });
        return { ...slice, deltas: newDeltas };
      });

      return {
        graph: { ...state.graph, slices: newSlices },
        resolvedStates: recomputeResolvedStates(newSlices),
        selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
      };
    });
  },

  updateRelationship: (edgeId, changes) => {
    const { currentSliceIndex, addDelta } = get();
    addDelta(currentSliceIndex, { op: 'updateEdge', edgeId, changes });
  },

  addChildToRelationship: (edgeId, child) => {
    const { currentSliceIndex, resolvedStates, addDelta } = get();
    const currentState = resolvedStates[currentSliceIndex];
    if (!currentState) return null;

    // Find the relationship
    const relationship = currentState.edges.get(edgeId);
    if (!relationship) return null;

    // Only allow for marriage or unmarried-relations
    if (relationship.type !== 'marriage' && relationship.type !== 'unmarried-relations') {
      return null;
    }

    // Get parent positions to place child between them
    const parent1 = currentState.nodes.get(relationship.sourceId);
    const parent2 = currentState.nodes.get(relationship.targetId);
    if (!parent1 || !parent2) return null;

    // Count existing children to spread them out horizontally
    const existingChildren = relationship.childIds?.length || 0;
    const childSpacing = 1.5;
    const offset = (existingChildren - (existingChildren > 0 ? (existingChildren - 1) / 2 : 0)) * childSpacing;

    // Position child below the midpoint of parents
    const midX = (parent1.position.x + parent2.position.x) / 2;
    const childPosition = {
      x: midX + offset,
      y: Math.min(parent1.position.y, parent2.position.y) - 2,
    };

    // Create the child node
    const childId = generateId();
    const childColor = getRandomNodeColor();
    addDelta(currentSliceIndex, {
      op: 'addNode',
      node: { ...child, id: childId, position: childPosition, color: childColor },
    });

    // Create parent-child relationships (hidden - the T-shape will render them)
    addDelta(currentSliceIndex, {
      op: 'addEdge',
      edge: { id: generateId(), type: 'parent-child', sourceId: relationship.sourceId, targetId: childId, hidden: true },
    });
    addDelta(currentSliceIndex, {
      op: 'addEdge',
      edge: { id: generateId(), type: 'parent-child', sourceId: relationship.targetId, targetId: childId, hidden: true },
    });

    // Update the marriage/unmarried-relations edge to include this child
    const updatedChildIds = [...(relationship.childIds || []), childId];
    addDelta(currentSliceIndex, {
      op: 'updateEdge',
      edgeId,
      changes: { childIds: updatedChildIds },
    });

    return childId;
  },

  toggleNodeSelection: (nodeId) => {
    set((state) => {
      const isSelected = state.selectedNodeIds.includes(nodeId);
      if (isSelected) {
        // Deselect
        return { selectedNodeIds: [], selectionBounds: null };
      } else {
        // Select - single node only (replaces any previous selection)
        return { selectedNodeIds: [nodeId], selectedEdgeId: null, selectionBounds: null };
      }
    });
  },

  setSelectedNodes: (nodeIds) => {
    set({ selectedNodeIds: nodeIds, selectedEdgeId: null });
  },

  clearNodeSelection: () => {
    set({ selectedNodeIds: [], selectionBounds: null });
  },

  selectEdge: (edgeId) => {
    set({ selectedEdgeId: edgeId, selectedNodeIds: [], selectionBounds: null });
  },

  setIsDraggingNode: (isDragging) => {
    set({ isDraggingNode: isDragging });
  },

  startSelectionBox: (x, y) => {
    set({ selectionBox: { startX: x, startY: y, endX: x, endY: y } });
  },

  updateSelectionBox: (x, y) => {
    set((state) => {
      if (!state.selectionBox) return state;
      return { selectionBox: { ...state.selectionBox, endX: x, endY: y } };
    });
  },

  finishSelectionBox: () => {
    set({ selectionBox: null });
  },

  cancelSelectionBox: () => {
    set({ selectionBox: null });
  },

  setSelectionBounds: (bounds) => {
    set({ selectionBounds: bounds });
  },

  startDraggingSelection: (screenX, screenY, initialPositions) => {
    set({
      isDraggingSelection: true,
      selectionDragState: { startScreenX: screenX, startScreenY: screenY, initialPositions },
    });
  },

  stopDraggingSelection: () => {
    // Clear everything - selection bounds, drag state, and unselect all nodes
    set({
      isDraggingSelection: false,
      selectionDragState: null,
      selectionBounds: null,
      selectedNodeIds: [],
    });
  },

  openContextMenu: (target, screenX, screenY) => {
    set({ contextMenu: { target, screenX, screenY } });
  },

  closeContextMenu: () => {
    set({ contextMenu: null });
  },

  loadGraph: (graph) => {
    set({
      graph,
      currentSliceIndex: 0,
      selectedNodeIds: [],
      selectedEdgeId: null,
      resolvedStates: recomputeResolvedStates(graph.slices),
    });
  },

  resetGraph: () => {
    const newGraph = createInitialGraph();
    set({
      graph: newGraph,
      currentSliceIndex: 0,
      selectedNodeIds: [],
      selectedEdgeId: null,
      resolvedStates: recomputeResolvedStates(newGraph.slices),
    });
  },

  updateMetadata: (metadata) => {
    set((state) => ({
      graph: { ...state.graph, metadata: { ...state.graph.metadata, ...metadata } },
    }));
  },

  // Walkthrough/Slideshow actions
  setViewMode: (mode) => {
    set((state) => ({
      viewMode: mode,
      // Stop playback when exiting focus mode
      isPlaying: mode === 'overview' ? false : state.isPlaying,
    }));
  },

  toggleViewMode: () => {
    set((state) => ({
      viewMode: state.viewMode === 'overview' ? 'focus' : 'overview',
      // Stop playback when exiting focus mode
      isPlaying: state.viewMode === 'focus' ? false : state.isPlaying,
    }));
  },

  startPlayback: () => {
    set({ isPlaying: true });
  },

  stopPlayback: () => {
    set({ isPlaying: false });
  },

  togglePlayback: () => {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  setPlaybackSpeed: (speed) => {
    set({ playbackSpeed: speed });
  },

  setHighlightedChanges: (changes) => {
    set({ highlightedChanges: changes });
  },

  clearHighlightedChanges: () => {
    set({ highlightedChanges: { newNodes: [], deadNodes: [], newEdges: [] } });
  },

  // Language actions
  setLanguage: (language) => {
    set({ language });
  },

  toggleLanguage: () => {
    set((state) => ({
      language: state.language === 'en' ? 'he' : 'en',
    }));
  },
}));

// Selectors
export const useCurrentResolvedState = () => {
  const { resolvedStates, currentSliceIndex } = useGraphStore();
  return resolvedStates[currentSliceIndex] || { nodes: new Map(), edges: new Map() };
};

export const useCurrentSlice = () => {
  const { graph, currentSliceIndex } = useGraphStore();
  return graph.slices[currentSliceIndex];
};
