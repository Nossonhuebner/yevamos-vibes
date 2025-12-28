import { useEffect } from 'react';
import { useGraphStore } from '@/store/graphStore';

/**
 * Global keyboard shortcuts for the application.
 * - Left/Right arrows: Navigate between slices (stops playback)
 * - Space: Toggle play/pause (Focus mode only)
 * - Escape: Exit Focus mode / clear selection
 * - Delete/Backspace: Delete selected nodes (with confirmation)
 */
export function useKeyboardShortcuts() {
  const setCurrentSlice = useGraphStore((state) => state.setCurrentSlice);
  const togglePlayback = useGraphStore((state) => state.togglePlayback);
  const stopPlayback = useGraphStore((state) => state.stopPlayback);
  const setViewMode = useGraphStore((state) => state.setViewMode);
  const purgePerson = useGraphStore((state) => state.purgePerson);
  const clearNodeSelection = useGraphStore((state) => state.clearNodeSelection);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const state = useGraphStore.getState();
      const { currentSliceIndex, graph, viewMode, selectedNodeIds, resolvedStates } = state;
      const sliceCount = graph.slices.length;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          stopPlayback();
          if (currentSliceIndex > 0) {
            setCurrentSlice(currentSliceIndex - 1);
          }
          break;

        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          stopPlayback();
          if (currentSliceIndex < sliceCount - 1) {
            setCurrentSlice(currentSliceIndex + 1);
          }
          break;

        case ' ': // Space bar
          e.preventDefault();
          if (viewMode === 'focus') {
            togglePlayback();
          }
          break;

        case 'Escape':
          e.preventDefault();
          if (selectedNodeIds.length > 0) {
            clearNodeSelection();
          } else if (viewMode === 'focus') {
            stopPlayback();
            setViewMode('overview');
          }
          break;

        case 'Delete':
        case 'Backspace':
          if (selectedNodeIds.length > 0) {
            e.preventDefault();
            // Get names for confirmation message
            const currentState = resolvedStates[currentSliceIndex];
            const names = selectedNodeIds
              .map(id => currentState?.nodes.get(id)?.name || 'Unknown')
              .join(', ');

            const message = selectedNodeIds.length === 1
              ? `Delete "${names}"? This will remove them from all slices.`
              : `Delete ${selectedNodeIds.length} people (${names})? This will remove them from all slices.`;

            if (window.confirm(message)) {
              // Delete all selected nodes
              selectedNodeIds.forEach(nodeId => {
                purgePerson(nodeId);
              });
              clearNodeSelection();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentSlice, togglePlayback, stopPlayback, setViewMode, purgePerson, clearNodeSelection]);
}
