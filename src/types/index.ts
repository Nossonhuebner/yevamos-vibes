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

// Color palette for node colors - bright, vibrant colors
export const NODE_COLOR_PALETTE = [
  '#e74c3c', // bright red
  '#27ae60', // bright green
  '#3498db', // bright blue
  '#9b59b6', // bright purple
  '#e67e22', // bright orange
  '#1abc9c', // bright teal
  '#f39c12', // bright gold
  '#2980b9', // ocean blue
  '#8e44ad', // deep purple
  '#16a085', // sea green
  '#c0392b', // dark red
  '#2ecc71', // emerald
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
  'marriage': { color: '#5fa052', lineStyle: 'solid', lineWidth: 2 },
  'divorce': { color: '#a65d57', lineStyle: 'dashed', lineWidth: 2 },
  'yibum': { color: '#d4a054', lineStyle: 'solid', lineWidth: 3 },
  'chalitzah': { color: '#8b7ba8', lineStyle: 'dashed', lineWidth: 2 },
  'parent-child': { color: '#7c9885', lineStyle: 'solid', lineWidth: 2 },
  'sibling': { color: '#a08b7f', lineStyle: 'solid', lineWidth: 1 },
  'unmarried-relations': { color: '#c4a86c', lineStyle: 'dotted', lineWidth: 2 },
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
