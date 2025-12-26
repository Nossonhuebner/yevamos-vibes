import {
  TemporalGraph,
  Person,
  Relationship,
  TimeSlice,
  LegacyTemporalGraph,
} from '@/types';

const STORAGE_KEY = 'yevamos-graph';

/**
 * Check if a graph is in the legacy format (has deltas instead of events)
 */
function isLegacyFormat(data: unknown): data is LegacyTemporalGraph {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (!obj.slices || !Array.isArray(obj.slices)) return false;
  if (obj.slices.length === 0) return false;

  // Check if first slice has 'deltas' (legacy) vs 'events' (new)
  const firstSlice = obj.slices[0] as Record<string, unknown>;
  return 'deltas' in firstSlice && !('events' in firstSlice);
}

/**
 * Migrate a legacy graph to the new format
 */
function migrateLegacyGraph(legacy: LegacyTemporalGraph): TemporalGraph {
  const nodes: Record<string, Person> = {};
  const edges: Record<string, Relationship> = {};
  const slices: TimeSlice[] = [];

  // Process each slice and build up the global nodes/edges
  for (let sliceIndex = 0; sliceIndex < legacy.slices.length; sliceIndex++) {
    const legacySlice = legacy.slices[sliceIndex];
    const events: TimeSlice['events'] = [];

    for (const delta of legacySlice.deltas) {
      switch (delta.op) {
        case 'addNode': {
          const legacyNode = delta.node;
          // If node already exists (from an earlier slice), don't re-add
          if (!nodes[legacyNode.id]) {
            const node: Person = {
              id: legacyNode.id,
              name: legacyNode.name,
              gender: legacyNode.gender,
              position: legacyNode.position,
              color: legacyNode.color,
              introducedSliceIndex: sliceIndex,
              deathSliceIndex: legacyNode.deathSliceIndex,
            };
            nodes[legacyNode.id] = node;
            events.push({ type: 'addNode', nodeId: legacyNode.id });
          }
          break;
        }

        case 'markDead': {
          // Update the node's death slice
          if (nodes[delta.nodeId]) {
            nodes[delta.nodeId] = {
              ...nodes[delta.nodeId],
              deathSliceIndex: delta.sliceIndex,
            };
            events.push({ type: 'death', nodeId: delta.nodeId });
          }
          break;
        }

        case 'updateNode': {
          // Apply position/name updates directly to the node (not as events)
          if (nodes[delta.nodeId]) {
            nodes[delta.nodeId] = {
              ...nodes[delta.nodeId],
              ...delta.changes,
            };
          }
          // No event needed - these are static property updates
          break;
        }

        case 'addEdge': {
          const legacyEdge = delta.edge;
          // If edge already exists, don't re-add
          if (!edges[legacyEdge.id]) {
            const edge: Relationship = {
              id: legacyEdge.id,
              type: legacyEdge.type,
              sourceId: legacyEdge.sourceId,
              targetId: legacyEdge.targetId,
              label: legacyEdge.label,
              childIds: legacyEdge.childIds,
              hidden: legacyEdge.hidden,
              introducedSliceIndex: sliceIndex,
            };
            edges[legacyEdge.id] = edge;
            events.push({ type: 'addEdge', edgeId: legacyEdge.id });
          }
          break;
        }

        case 'updateEdge': {
          // Check if this is a type change (temporal) or other change (static)
          if (delta.changes.type && edges[delta.edgeId]) {
            events.push({ type: 'updateEdge', edgeId: delta.edgeId, changes: delta.changes });
          } else if (edges[delta.edgeId]) {
            // Static change - apply directly
            edges[delta.edgeId] = {
              ...edges[delta.edgeId],
              ...delta.changes,
            };
          }
          break;
        }

        case 'removeEdge': {
          // In the new model, we delete the edge entirely rather than use events
          delete edges[delta.edgeId];
          break;
        }

        case 'removeNode': {
          // In the new model, we delete the node entirely
          delete nodes[delta.nodeId];
          // Also remove edges involving this node
          for (const [edgeId, edge] of Object.entries(edges)) {
            if (edge.sourceId === delta.nodeId || edge.targetId === delta.nodeId) {
              delete edges[edgeId];
            }
          }
          break;
        }
      }
    }

    slices.push({
      id: legacySlice.id,
      label: legacySlice.label,
      timestamp: legacySlice.timestamp,
      events,
    });
  }

  return {
    nodes,
    edges,
    slices,
    metadata: legacy.metadata,
  };
}

/**
 * Save graph to localStorage
 */
export function saveToLocalStorage(graph: TemporalGraph): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(graph));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

/**
 * Load graph from localStorage
 */
export function loadFromLocalStorage(): TemporalGraph | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);

      // Check if this is legacy format and migrate if needed
      if (isLegacyFormat(parsed)) {
        console.log('Migrating legacy graph format to new format...');
        const migrated = migrateLegacyGraph(parsed);
        // Save the migrated version
        saveToLocalStorage(migrated);
        return migrated;
      }

      return parsed as TemporalGraph;
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return null;
}

/**
 * Clear saved graph from localStorage
 */
export function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export graph to JSON file
 */
export function exportToJson(graph: TemporalGraph): void {
  const data = JSON.stringify(graph, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${graph.metadata.title.replace(/\s+/g, '-').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import graph from JSON file
 */
export function importFromJson(file: File): Promise<TemporalGraph> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);

        // Check if this is legacy format and migrate if needed
        if (isLegacyFormat(parsed)) {
          console.log('Migrating imported legacy graph format to new format...');
          const migrated = migrateLegacyGraph(parsed);
          resolve(migrated);
          return;
        }

        const data = parsed as TemporalGraph;

        // Basic validation for new format
        if (!data.slices || !Array.isArray(data.slices)) {
          throw new Error('Invalid graph format: missing slices array');
        }
        if (!data.metadata) {
          throw new Error('Invalid graph format: missing metadata');
        }
        if (!data.nodes || typeof data.nodes !== 'object') {
          throw new Error('Invalid graph format: missing nodes object');
        }
        if (!data.edges || typeof data.edges !== 'object') {
          throw new Error('Invalid graph format: missing edges object');
        }

        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Encode graph to a URL-safe string using base64
 */
export function encodeGraphToUrl(graph: TemporalGraph): string {
  try {
    const jsonString = JSON.stringify(graph);
    // Use encodeURIComponent to handle unicode, then btoa for base64
    const base64 = btoa(encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g,
      (_, p1) => String.fromCharCode(parseInt(p1, 16))
    ));
    return base64;
  } catch (e) {
    console.error('Failed to encode graph to URL:', e);
    throw e;
  }
}

/**
 * Decode graph from a URL-safe string
 */
export function decodeGraphFromUrl(encoded: string): TemporalGraph | null {
  try {
    // Decode base64 then handle unicode
    const jsonString = decodeURIComponent(
      atob(encoded).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    const parsed = JSON.parse(jsonString);

    // Check if this is legacy format and migrate if needed
    if (isLegacyFormat(parsed)) {
      console.log('Migrating URL graph from legacy format...');
      return migrateLegacyGraph(parsed);
    }

    const data = parsed as TemporalGraph;

    // Basic validation
    if (!data.slices || !Array.isArray(data.slices)) {
      throw new Error('Invalid graph format: missing slices array');
    }
    if (!data.metadata) {
      throw new Error('Invalid graph format: missing metadata');
    }
    if (!data.nodes || typeof data.nodes !== 'object') {
      throw new Error('Invalid graph format: missing nodes object');
    }
    if (!data.edges || typeof data.edges !== 'object') {
      throw new Error('Invalid graph format: missing edges object');
    }

    return data;
  } catch (e) {
    console.error('Failed to decode graph from URL:', e);
    return null;
  }
}

/**
 * Get the shareable URL for a graph
 */
export function getShareableUrl(graph: TemporalGraph): string {
  const encoded = encodeGraphToUrl(graph);
  const url = new URL(window.location.href);
  url.hash = `data=${encoded}`;
  return url.toString();
}

/**
 * Check if the current URL contains graph data and return it
 */
export function getGraphFromUrl(): TemporalGraph | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#data=')) {
    return null;
  }
  const encoded = hash.slice(6); // Remove '#data='
  return decodeGraphFromUrl(encoded);
}

/**
 * Clear the graph data from the URL (without reloading)
 */
export function clearUrlData(): void {
  const url = new URL(window.location.href);
  url.hash = '';
  window.history.replaceState(null, '', url.pathname + url.search);
}
