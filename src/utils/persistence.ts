import { TemporalGraph } from '@/types';

const STORAGE_KEY = 'yevamos-graph';

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
      return JSON.parse(data) as TemporalGraph;
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
        const data = JSON.parse(e.target?.result as string) as TemporalGraph;
        // Basic validation
        if (!data.slices || !Array.isArray(data.slices)) {
          throw new Error('Invalid graph format: missing slices array');
        }
        if (!data.metadata) {
          throw new Error('Invalid graph format: missing metadata');
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
