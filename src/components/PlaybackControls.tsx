import { useEffect, useRef } from 'react';
import { useGraphStore, PLAYBACK_SPEED_MS, PlaybackSpeed } from '@/store/graphStore';
import { computeSliceChanges } from '@/utils/sliceDelta';
import { useTranslation } from '@/hooks/useTranslation';

export function PlaybackControls() {
  const viewMode = useGraphStore((state) => state.viewMode);
  const isPlaying = useGraphStore((state) => state.isPlaying);
  const playbackSpeed = useGraphStore((state) => state.playbackSpeed);
  const currentSliceIndex = useGraphStore((state) => state.currentSliceIndex);
  const slices = useGraphStore((state) => state.graph.slices);
  const resolvedStates = useGraphStore((state) => state.resolvedStates);
  const togglePlayback = useGraphStore((state) => state.togglePlayback);
  const stopPlayback = useGraphStore((state) => state.stopPlayback);
  const setPlaybackSpeed = useGraphStore((state) => state.setPlaybackSpeed);
  const setCurrentSlice = useGraphStore((state) => state.setCurrentSlice);
  const setHighlightedChanges = useGraphStore((state) => state.setHighlightedChanges);
  const clearHighlightedChanges = useGraphStore((state) => state.clearHighlightedChanges);
  const { t } = useTranslation();

  // Store previous slice index to detect changes
  const prevSliceIndexRef = useRef(currentSliceIndex);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || viewMode !== 'focus') return;

    const interval = setInterval(() => {
      const currentIndex = useGraphStore.getState().currentSliceIndex;
      const sliceCount = useGraphStore.getState().graph.slices.length;

      if (currentIndex < sliceCount - 1) {
        setCurrentSlice(currentIndex + 1);
      } else {
        // Stop at last slice
        stopPlayback();
      }
    }, PLAYBACK_SPEED_MS[playbackSpeed]);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, viewMode, setCurrentSlice, stopPlayback]);

  // Compute and set highlights when slice changes
  useEffect(() => {
    const prevIndex = prevSliceIndexRef.current;
    if (prevIndex !== currentSliceIndex && viewMode === 'focus') {
      const prevState = resolvedStates[prevIndex];
      const currentState = resolvedStates[currentSliceIndex];

      if (currentState) {
        const changes = computeSliceChanges(
          prevState,
          currentState,
          prevIndex,
          currentSliceIndex
        );
        setHighlightedChanges(changes);

        // Clear highlights after 2 seconds
        const timeout = setTimeout(() => {
          clearHighlightedChanges();
        }, 2000);

        prevSliceIndexRef.current = currentSliceIndex;
        return () => clearTimeout(timeout);
      }
    }
    prevSliceIndexRef.current = currentSliceIndex;
  }, [currentSliceIndex, viewMode, resolvedStates, setHighlightedChanges, clearHighlightedChanges]);

  // Only show in Focus mode
  if (viewMode !== 'focus') return null;

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlaybackSpeed(e.target.value as PlaybackSpeed);
  };

  return (
    <div className="playback-controls">
      <button
        className={`btn btn-sm ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
        onClick={togglePlayback}
        disabled={currentSliceIndex === slices.length - 1 && !isPlaying}
        title={isPlaying ? `${t('pause')} (Space)` : `${t('play')} (Space)`}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <select
        value={playbackSpeed}
        onChange={handleSpeedChange}
        className="playback-speed-select"
        title={t('playbackSpeed')}
      >
        <option value="slow">{t('slow')}</option>
        <option value="medium">{t('medium')}</option>
        <option value="fast">{t('fast')}</option>
      </select>
    </div>
  );
}
