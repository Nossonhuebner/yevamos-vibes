import { create } from 'zustand';
import { Person, Relationship, ResolvedGraphState, TemporalGraph, TimeSlice, getRandomNodeColor } from '@/types';
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

  // Edit description modal
  editDescriptionModal: { sliceIndex: number } | null;

  // Language
  language: Language;

  // Computed (cached)
  resolvedStates: ResolvedGraphState[];

  // Slice actions
  setCurrentSlice: (index: number) => void;
  addSlice: (label: string, afterIndex?: number) => void;
  removeSlice: (index: number) => void;
  updateSliceLabel: (index: number, label: string) => void;

  // Node actions
  addPerson: (person: Omit<Person, 'id' | 'deathSliceIndex' | 'color' | 'introducedSliceIndex'>) => string;
  markPersonDead: (nodeId: string) => void; // Mark as dead at current slice
  purgePerson: (nodeId: string) => void; // Remove from ALL slices entirely
  updatePersonPosition: (nodeId: string, position: { x: number; y: number }) => void;
  updateMultiplePositions: (updates: { nodeId: string; position: { x: number; y: number } }[]) => void;
  updatePersonName: (nodeId: string, name: string) => void;

  // Edge actions
  addRelationship: (relationship: Omit<Relationship, 'id' | 'introducedSliceIndex'>) => string;
  removeRelationship: (edgeId: string) => void;
  updateRelationship: (edgeId: string, changes: Partial<Omit<Relationship, 'id' | 'introducedSliceIndex'>>) => void;
  addChildToRelationship: (edgeId: string, child: Omit<Person, 'id' | 'deathSliceIndex' | 'color' | 'introducedSliceIndex'>) => string | null;

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

  // Edit description modal
  openEditDescription: (sliceIndex: number) => void;
  closeEditDescription: () => void;

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
  nodes: {},
  edges: {},
  slices: [
    {
      id: generateId(),
      label: '',
      events: [],
    },
  ],
  metadata: {
    title: 'Untitled Graph',
    description: '',
  },
});

const recomputeResolvedStates = (graph: TemporalGraph): ResolvedGraphState[] => {
  return resolveAllSlices(graph);
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
  editDescriptionModal: null,
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
        events: [],
      };
      const newSlices = [...state.graph.slices];
      newSlices.splice(insertIndex, 0, newSlice);

      // Update introducedSliceIndex for any nodes/edges introduced after this point
      const updatedNodes = { ...state.graph.nodes };
      for (const [id, node] of Object.entries(updatedNodes)) {
        if (node.introducedSliceIndex >= insertIndex) {
          updatedNodes[id] = { ...node, introducedSliceIndex: node.introducedSliceIndex + 1 };
        }
        if (node.deathSliceIndex !== undefined && node.deathSliceIndex >= insertIndex) {
          updatedNodes[id] = { ...updatedNodes[id], deathSliceIndex: node.deathSliceIndex + 1 };
        }
      }

      const updatedEdges = { ...state.graph.edges };
      for (const [id, edge] of Object.entries(updatedEdges)) {
        if (edge.introducedSliceIndex >= insertIndex) {
          updatedEdges[id] = { ...edge, introducedSliceIndex: edge.introducedSliceIndex + 1 };
        }
      }

      const newGraph = {
        ...state.graph,
        nodes: updatedNodes,
        edges: updatedEdges,
        slices: newSlices,
      };

      return {
        graph: newGraph,
        resolvedStates: recomputeResolvedStates(newGraph),
        currentSliceIndex: insertIndex,
      };
    });
  },

  removeSlice: (index) => {
    set((state) => {
      if (state.graph.slices.length <= 1) return state; // Keep at least one slice

      // Remove nodes/edges introduced at this slice
      const updatedNodes = { ...state.graph.nodes };
      const updatedEdges = { ...state.graph.edges };

      for (const [id, node] of Object.entries(updatedNodes)) {
        if (node.introducedSliceIndex === index) {
          delete updatedNodes[id];
        } else if (node.introducedSliceIndex > index) {
          updatedNodes[id] = { ...node, introducedSliceIndex: node.introducedSliceIndex - 1 };
        }
        if (updatedNodes[id]?.deathSliceIndex !== undefined) {
          if (updatedNodes[id].deathSliceIndex === index) {
            // Death was at this slice, remove the death marker
            const { deathSliceIndex, ...rest } = updatedNodes[id];
            updatedNodes[id] = rest as Person;
          } else if (updatedNodes[id].deathSliceIndex! > index) {
            updatedNodes[id] = { ...updatedNodes[id], deathSliceIndex: updatedNodes[id].deathSliceIndex! - 1 };
          }
        }
      }

      for (const [id, edge] of Object.entries(updatedEdges)) {
        if (edge.introducedSliceIndex === index) {
          delete updatedEdges[id];
        } else if (edge.introducedSliceIndex > index) {
          updatedEdges[id] = { ...edge, introducedSliceIndex: edge.introducedSliceIndex - 1 };
        }
      }

      const newSlices = state.graph.slices.filter((_, i) => i !== index);
      const newIndex = Math.min(state.currentSliceIndex, newSlices.length - 1);

      const newGraph = {
        ...state.graph,
        nodes: updatedNodes,
        edges: updatedEdges,
        slices: newSlices,
      };

      return {
        graph: newGraph,
        resolvedStates: recomputeResolvedStates(newGraph),
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

  addPerson: (person) => {
    const id = generateId();
    const color = getRandomNodeColor();
    const { currentSliceIndex, graph } = get();

    const newNode: Person = {
      ...person,
      id,
      color,
      introducedSliceIndex: currentSliceIndex,
    };

    // Add event to the slice
    const newSlices = [...graph.slices];
    newSlices[currentSliceIndex] = {
      ...newSlices[currentSliceIndex],
      events: [...newSlices[currentSliceIndex].events, { type: 'addNode', nodeId: id }],
    };

    const newGraph = {
      ...graph,
      nodes: { ...graph.nodes, [id]: newNode },
      slices: newSlices,
    };

    set({
      graph: newGraph,
      resolvedStates: recomputeResolvedStates(newGraph),
    });

    return id;
  },

  markPersonDead: (nodeId) => {
    const { currentSliceIndex, graph } = get();
    const node = graph.nodes[nodeId];
    if (!node) return;

    // Update the node's deathSliceIndex
    const updatedNode = { ...node, deathSliceIndex: currentSliceIndex };

    // Add death event to the slice
    const newSlices = [...graph.slices];
    newSlices[currentSliceIndex] = {
      ...newSlices[currentSliceIndex],
      events: [...newSlices[currentSliceIndex].events, { type: 'death', nodeId }],
    };

    const newGraph = {
      ...graph,
      nodes: { ...graph.nodes, [nodeId]: updatedNode },
      slices: newSlices,
    };

    set({
      graph: newGraph,
      resolvedStates: recomputeResolvedStates(newGraph),
    });
  },

  purgePerson: (nodeId) => {
    set((state) => {
      // Remove the node
      const { [nodeId]: removed, ...remainingNodes } = state.graph.nodes;

      // Remove any edges that reference this node
      const remainingEdges: Record<string, Relationship> = {};
      for (const [id, edge] of Object.entries(state.graph.edges)) {
        if (edge.sourceId !== nodeId && edge.targetId !== nodeId) {
          // Also remove this node from any childIds arrays
          if (edge.childIds?.includes(nodeId)) {
            remainingEdges[id] = {
              ...edge,
              childIds: edge.childIds.filter((cid) => cid !== nodeId),
            };
          } else {
            remainingEdges[id] = edge;
          }
        }
      }

      // Remove any events referencing this node from slices
      const newSlices = state.graph.slices.map((slice) => ({
        ...slice,
        events: slice.events.filter((event) => {
          if (event.type === 'addNode' && event.nodeId === nodeId) return false;
          if (event.type === 'death' && event.nodeId === nodeId) return false;
          return true;
        }),
      }));

      const newGraph = {
        ...state.graph,
        nodes: remainingNodes,
        edges: remainingEdges,
        slices: newSlices,
      };

      return {
        graph: newGraph,
        resolvedStates: recomputeResolvedStates(newGraph),
        selectedNodeIds: state.selectedNodeIds.filter((id) => id !== nodeId),
      };
    });
  },

  updatePersonPosition: (nodeId, position) => {
    // Position updates directly modify the global node definition
    set((state) => {
      const node = state.graph.nodes[nodeId];
      if (!node) return state;

      const newGraph = {
        ...state.graph,
        nodes: {
          ...state.graph.nodes,
          [nodeId]: { ...node, position },
        },
      };

      return {
        graph: newGraph,
        resolvedStates: recomputeResolvedStates(newGraph),
      };
    });
  },

  updateMultiplePositions: (updates) => {
    // Batch position updates for multiple nodes (used for group drag)
    set((state) => {
      const newNodes = { ...state.graph.nodes };
      for (const { nodeId, position } of updates) {
        if (newNodes[nodeId]) {
          newNodes[nodeId] = { ...newNodes[nodeId], position };
        }
      }

      const newGraph = {
        ...state.graph,
        nodes: newNodes,
      };

      return {
        graph: newGraph,
        resolvedStates: recomputeResolvedStates(newGraph),
      };
    });
  },

  updatePersonName: (nodeId, name) => {
    // Name updates directly modify the global node definition
    set((state) => {
      const node = state.graph.nodes[nodeId];
      if (!node) return state;

      const newGraph = {
        ...state.graph,
        nodes: {
          ...state.graph.nodes,
          [nodeId]: { ...node, name },
        },
      };

      return {
        graph: newGraph,
        resolvedStates: recomputeResolvedStates(newGraph),
      };
    });
  },

  addRelationship: (relationship) => {
    const id = generateId();
    const { currentSliceIndex, graph } = get();

    const newEdge: Relationship = {
      ...relationship,
      id,
      introducedSliceIndex: currentSliceIndex,
    };

    // Add event to the slice
    const newSlices = [...graph.slices];
    newSlices[currentSliceIndex] = {
      ...newSlices[currentSliceIndex],
      events: [...newSlices[currentSliceIndex].events, { type: 'addEdge', edgeId: id }],
    };

    const newGraph = {
      ...graph,
      edges: { ...graph.edges, [id]: newEdge },
      slices: newSlices,
    };

    set({
      graph: newGraph,
      resolvedStates: recomputeResolvedStates(newGraph),
    });

    return id;
  },

  removeRelationship: (edgeId) => {
    set((state) => {
      // Remove the edge from global definitions
      const { [edgeId]: removed, ...remainingEdges } = state.graph.edges;

      // Remove any events referencing this edge
      const newSlices = state.graph.slices.map((slice) => ({
        ...slice,
        events: slice.events.filter((event) => {
          if (event.type === 'addEdge' && event.edgeId === edgeId) return false;
          if (event.type === 'updateEdge' && event.edgeId === edgeId) return false;
          if (event.type === 'removeEdge' && event.edgeId === edgeId) return false;
          return true;
        }),
      }));

      const newGraph = {
        ...state.graph,
        edges: remainingEdges,
        slices: newSlices,
      };

      return {
        graph: newGraph,
        resolvedStates: recomputeResolvedStates(newGraph),
        selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
      };
    });
  },

  updateRelationship: (edgeId, changes) => {
    const { currentSliceIndex, graph, resolvedStates } = get();
    const currentState = resolvedStates[currentSliceIndex];
    // Get the resolved edge state (not the global definition)
    const resolvedEdge = currentState?.edges.get(edgeId);
    const edge = graph.edges[edgeId];
    if (!edge) return;

    // For temporal changes (like type: marriage -> divorce), add an event
    // For static changes (like childIds), update the global edge directly

    // Check if this is a type change (temporal event)
    if (changes.type && changes.type !== (resolvedEdge?.type || edge.type)) {
      // If divorcing from nisuin, set the divorceFromNisuin flag
      const updatedChanges = { ...changes };
      if (changes.type === 'divorce' && (resolvedEdge?.type || edge.type) === 'nisuin') {
        updatedChanges.divorceFromNisuin = true;
      }

      // Add updateEdge event to current slice
      const newSlices = [...graph.slices];
      newSlices[currentSliceIndex] = {
        ...newSlices[currentSliceIndex],
        events: [...newSlices[currentSliceIndex].events, { type: 'updateEdge', edgeId, changes: updatedChanges }],
      };

      const newGraph = {
        ...graph,
        slices: newSlices,
      };

      set({
        graph: newGraph,
        resolvedStates: recomputeResolvedStates(newGraph),
      });
    } else {
      // For non-type changes (like adding children), update the global edge
      const updatedEdge = { ...edge, ...changes };

      const newGraph = {
        ...graph,
        edges: { ...graph.edges, [edgeId]: updatedEdge },
      };

      set({
        graph: newGraph,
        resolvedStates: recomputeResolvedStates(newGraph),
      });
    }
  },

  addChildToRelationship: (edgeId, child) => {
    const { currentSliceIndex, resolvedStates, graph } = get();
    const currentState = resolvedStates[currentSliceIndex];
    if (!currentState) return null;

    // Find the relationship
    const relationship = currentState.edges.get(edgeId);
    if (!relationship) return null;

    // Only allow for erusin, nisuin, or unmarried-relations
    if (relationship.type !== 'erusin' && relationship.type !== 'nisuin' && relationship.type !== 'unmarried-relations') {
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
    const childNode: Person = {
      ...child,
      id: childId,
      position: childPosition,
      color: childColor,
      introducedSliceIndex: currentSliceIndex,
    };

    // Create parent-child relationships
    const parentChildEdge1Id = generateId();
    const parentChildEdge2Id = generateId();
    const parentChildEdge1: Relationship = {
      id: parentChildEdge1Id,
      type: 'parent-child',
      sourceId: relationship.sourceId,
      targetId: childId,
      hidden: true,
      introducedSliceIndex: currentSliceIndex,
    };
    const parentChildEdge2: Relationship = {
      id: parentChildEdge2Id,
      type: 'parent-child',
      sourceId: relationship.targetId,
      targetId: childId,
      hidden: true,
      introducedSliceIndex: currentSliceIndex,
    };

    // Update the marriage/unmarried-relations edge to include this child
    const updatedChildIds = [...(graph.edges[edgeId]?.childIds || []), childId];
    const updatedEdge = { ...graph.edges[edgeId], childIds: updatedChildIds };

    // Add events
    const newSlices = [...graph.slices];
    newSlices[currentSliceIndex] = {
      ...newSlices[currentSliceIndex],
      events: [
        ...newSlices[currentSliceIndex].events,
        { type: 'addNode', nodeId: childId },
        { type: 'addEdge', edgeId: parentChildEdge1Id },
        { type: 'addEdge', edgeId: parentChildEdge2Id },
      ],
    };

    const newGraph = {
      ...graph,
      nodes: { ...graph.nodes, [childId]: childNode },
      edges: {
        ...graph.edges,
        [edgeId]: updatedEdge,
        [parentChildEdge1Id]: parentChildEdge1,
        [parentChildEdge2Id]: parentChildEdge2,
      },
      slices: newSlices,
    };

    set({
      graph: newGraph,
      resolvedStates: recomputeResolvedStates(newGraph),
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

  openEditDescription: (sliceIndex) => {
    set({ editDescriptionModal: { sliceIndex } });
  },

  closeEditDescription: () => {
    set({ editDescriptionModal: null });
  },

  loadGraph: (graph) => {
    set({
      graph,
      currentSliceIndex: 0,
      selectedNodeIds: [],
      selectedEdgeId: null,
      resolvedStates: recomputeResolvedStates(graph),
    });
  },

  resetGraph: () => {
    const newGraph = createInitialGraph();
    set({
      graph: newGraph,
      currentSliceIndex: 0,
      selectedNodeIds: [],
      selectedEdgeId: null,
      resolvedStates: recomputeResolvedStates(newGraph),
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
