import { useEffect } from 'react';
import { useGraphStore } from '@/store/graphStore';

/**
 * Global keyboard shortcuts for the walkthrough feature.
 * - Left/Right arrows: Navigate between slices (stops playback)
 * - Space: Toggle play/pause (Focus mode only)
 * - Escape: Exit Focus mode
 */
export function useKeyboardShortcuts() {
  const setCurrentSlice = useGraphStore((state) => state.setCurrentSlice);
  const togglePlayback = useGraphStore((state) => state.togglePlayback);
  const stopPlayback = useGraphStore((state) => state.stopPlayback);
  const setViewMode = useGraphStore((state) => state.setViewMode);

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
      const { currentSliceIndex, graph, viewMode } = state;
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
          if (viewMode === 'focus') {
            e.preventDefault();
            stopPlayback();
            setViewMode('overview');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentSlice, togglePlayback, stopPlayback, setViewMode]);
}
