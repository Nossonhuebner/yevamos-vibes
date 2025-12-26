// Core entity types
export interface Person {
  id: string;
  name: string;
  gender: 'male' | 'female';
  position: { x: number; y: number };
  deathSliceIndex?: number; // Slice index where this person died (undefined = alive)
  color: string; // Random color assigned at creation for visual identification
}

// Color palette for node colors (distinct, visually appealing)
export const NODE_COLOR_PALETTE = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
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
}

// Delta operations for temporal state management
export type DeltaOperation =
  | { op: 'addNode'; node: Person }
  | { op: 'removeNode'; nodeId: string }
  | { op: 'updateNode'; nodeId: string; changes: Partial<Omit<Person, 'id'>> }
  | { op: 'markDead'; nodeId: string; sliceIndex: number } // Mark a person as dead at this slice
  | { op: 'addEdge'; edge: Relationship }
  | { op: 'removeEdge'; edgeId: string }
  | { op: 'updateEdge'; edgeId: string; changes: Partial<Omit<Relationship, 'id'>> };

export interface TimeSlice {
  id: string;
  label: string;
  timestamp?: number;
  deltas: DeltaOperation[];
}

export interface TemporalGraph {
  slices: TimeSlice[];
  metadata: {
    title: string;
    description?: string;
  };
}

// Resolved state at a given time slice
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
  'marriage': { color: '#22c55e', lineStyle: 'solid', lineWidth: 2 },
  'divorce': { color: '#ef4444', lineStyle: 'dashed', lineWidth: 2 },
  'yibum': { color: '#f97316', lineStyle: 'solid', lineWidth: 3 },
  'chalitzah': { color: '#8b5cf6', lineStyle: 'dashed', lineWidth: 2 },
  'parent-child': { color: '#3b82f6', lineStyle: 'solid', lineWidth: 2 },
  'sibling': { color: '#ec4899', lineStyle: 'solid', lineWidth: 1 },
  'unmarried-relations': { color: '#facc15', lineStyle: 'dotted', lineWidth: 2 },
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
