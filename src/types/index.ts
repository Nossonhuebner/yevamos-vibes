// Core entity types
export interface Person {
  id: string;
  name: string;
  gender: 'male' | 'female';
  position: { x: number; y: number };
  color: string; // Random color assigned at creation for visual identification
  // Temporal metadata (set when introduced/marked dead)
  introducedSliceIndex: number; // Slice where this person first appears
  deathSliceIndex?: number; // Slice index where this person died (undefined = alive)
}

// Color palette for node colors - vivid, saturated colors
export const NODE_COLOR_PALETTE = [
  '#ff6b6b', // coral red
  '#4ecdc4', // turquoise
  '#ffe66d', // sunny yellow
  '#a855f7', // vivid purple
  '#fb923c', // bright orange
  '#2dd4bf', // teal
  '#f472b6', // pink
  '#60a5fa', // sky blue
  '#a3e635', // lime green
  '#fbbf24', // amber
  '#c084fc', // lavender
  '#34d399', // emerald
];

export function getRandomNodeColor(): string {
  return NODE_COLOR_PALETTE[Math.floor(Math.random() * NODE_COLOR_PALETTE.length)];
}

export type RelationshipType =
  | 'marriage'
  | 'divorce'
  | 'yibum'
  | 'chalitzah'
  | 'parent-child'
  | 'sibling'
  | 'unmarried-relations';

export interface Relationship {
  id: string;
  type: RelationshipType;
  sourceId: string;
  targetId: string;
  label?: string;
  childIds?: string[]; // For marriage/unmarried-relations: IDs of children connected to this relationship
  hidden?: boolean; // If true, don't render this edge (used for parent-child edges that are part of a T-shape)
  introducedSliceIndex: number; // Slice where this relationship was created
}

// Temporal events - things that happen at specific points in time
export type TemporalEvent =
  | { type: 'addNode'; nodeId: string } // Node is introduced at this slice
  | { type: 'death'; nodeId: string } // Node dies at this slice
  | { type: 'addEdge'; edgeId: string } // Edge is created at this slice
  | { type: 'updateEdge'; edgeId: string; changes: Partial<Omit<Relationship, 'id' | 'introducedSliceIndex'>> }
  | { type: 'removeEdge'; edgeId: string };

export interface TimeSlice {
  id: string;
  label: string;
  timestamp?: number;
  events: TemporalEvent[];
}

export interface TemporalGraph {
  // Global definitions - single source of truth for static properties
  nodes: Record<string, Person>;
  edges: Record<string, Relationship>;
  // Timeline of events
  slices: TimeSlice[];
  metadata: {
    title: string;
    description?: string;
  };
}

// Resolved state at a given time slice (computed from global + events)
export interface ResolvedGraphState {
  nodes: Map<string, Person>;
  edges: Map<string, Relationship>;
}

// Relationship type styling
export interface RelationshipStyle {
  color: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  lineWidth: number;
}

export const RELATIONSHIP_STYLES: Record<RelationshipType, RelationshipStyle> = {
  'marriage': { color: '#34d399', lineStyle: 'solid', lineWidth: 2 },
  'divorce': { color: '#f87171', lineStyle: 'dashed', lineWidth: 2 },
  'yibum': { color: '#fbbf24', lineStyle: 'solid', lineWidth: 3 },
  'chalitzah': { color: '#c084fc', lineStyle: 'dashed', lineWidth: 2 },
  'parent-child': { color: '#22d3ee', lineStyle: 'solid', lineWidth: 2 },
  'sibling': { color: '#94a3b8', lineStyle: 'solid', lineWidth: 1 },
  'unmarried-relations': { color: '#fb923c', lineStyle: 'dotted', lineWidth: 2 },
};

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  'marriage': 'Marriage',
  'divorce': 'Divorce',
  'yibum': 'Yibum',
  'chalitzah': 'Chalitzah',
  'parent-child': 'Parent-Child',
  'sibling': 'Sibling',
  'unmarried-relations': 'Unmarried Relations',
};

// ============================================================
// Legacy types for backwards compatibility with old saved files
// ============================================================
export type LegacyDeltaOperation =
  | { op: 'addNode'; node: LegacyPerson }
  | { op: 'removeNode'; nodeId: string }
  | { op: 'updateNode'; nodeId: string; changes: Partial<Omit<LegacyPerson, 'id'>> }
  | { op: 'markDead'; nodeId: string; sliceIndex: number }
  | { op: 'addEdge'; edge: LegacyRelationship }
  | { op: 'removeEdge'; edgeId: string }
  | { op: 'updateEdge'; edgeId: string; changes: Partial<Omit<LegacyRelationship, 'id'>> };

export interface LegacyPerson {
  id: string;
  name: string;
  gender: 'male' | 'female';
  position: { x: number; y: number };
  deathSliceIndex?: number;
  color: string;
}

export interface LegacyRelationship {
  id: string;
  type: RelationshipType;
  sourceId: string;
  targetId: string;
  label?: string;
  childIds?: string[];
  hidden?: boolean;
}

export interface LegacyTimeSlice {
  id: string;
  label: string;
  timestamp?: number;
  deltas: LegacyDeltaOperation[];
}

export interface LegacyTemporalGraph {
  slices: LegacyTimeSlice[];
  metadata: {
    title: string;
    description?: string;
  };
}
