import { useGraphStore } from '@/store/graphStore';
import { PlaybackControls } from './PlaybackControls';
import { useTranslation } from '@/hooks/useTranslation';

export function Timeline() {
  const slices = useGraphStore((state) => state.graph.slices);
  const currentSliceIndex = useGraphStore((state) => state.currentSliceIndex);
  const setCurrentSlice = useGraphStore((state) => state.setCurrentSlice);
  const addSlice = useGraphStore((state) => state.addSlice);
  const viewMode = useGraphStore((state) => state.viewMode);
  const stopPlayback = useGraphStore((state) => state.stopPlayback);
  const { t } = useTranslation();

  const currentSlice = slices[currentSliceIndex];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    stopPlayback(); // Stop playback on manual slider change
    setCurrentSlice(parseInt(e.target.value, 10));
  };

  const handlePrev = () => {
    stopPlayback(); // Stop playback on manual navigation
    if (currentSliceIndex > 0) {
      setCurrentSlice(currentSliceIndex - 1);
    }
  };

  const handleNext = () => {
    stopPlayback(); // Stop playback on manual navigation
    if (currentSliceIndex < slices.length - 1) {
      setCurrentSlice(currentSliceIndex + 1);
    }
  };

  const handleAddSlice = () => {
    addSlice('', currentSliceIndex);
  };

  return (
    <div className="timeline-container">
      {/* Navigation buttons */}
      <button
        className="btn btn-secondary btn-sm"
        onClick={handlePrev}
        disabled={currentSliceIndex === 0}
        title="Previous slice (←)"
      >
        ◀
      </button>

      {/* Slider */}
      <div className="timeline-slider">
        <input
          type="range"
          min={0}
          max={slices.length - 1}
          value={currentSliceIndex}
          onChange={handleSliderChange}
        />
      </div>

      <button
        className="btn btn-secondary btn-sm"
        onClick={handleNext}
        disabled={currentSliceIndex === slices.length - 1}
        title="Next slice (→)"
      >
        ▶
      </button>

      {/* Slice label */}
      <div className="timeline-label">
        <span style={{ color: '#94a3b8' }}>
          {currentSliceIndex + 1}/{slices.length}
        </span>
        {currentSlice?.label && (
          <span style={{ marginLeft: '6px', color: '#f8fafc' }}>
            {currentSlice.label}
          </span>
        )}
      </div>

      {/* Add slice button (only in overview mode) */}
      {viewMode === 'overview' && (
        <button
          className="btn btn-primary btn-sm"
          onClick={handleAddSlice}
          title={t('addNewSlice')}
        >
          +
        </button>
      )}

      {/* Playback controls (only visible in Focus mode) */}
      <PlaybackControls />
    </div>
  );
}
