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
    addSlice(`Time ${slices.length}`, currentSliceIndex);
  };

  return (
    <div className="timeline-container">
      <div className="timeline-controls">
        <button
          className="btn btn-secondary btn-sm"
          onClick={handlePrev}
          disabled={currentSliceIndex === 0}
        >
          ←
        </button>
      </div>

      <div className="timeline-slider">
        <input
          type="range"
          min={0}
          max={slices.length - 1}
          value={currentSliceIndex}
          onChange={handleSliderChange}
        />
      </div>

      <div className="timeline-label">
        {currentSlice?.label || t('noSlice')}
        <span style={{ color: '#64748b', marginLeft: '8px' }}>
          ({currentSliceIndex + 1}/{slices.length})
        </span>
      </div>

      <div className="timeline-controls">
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleNext}
          disabled={currentSliceIndex === slices.length - 1}
        >
          →
        </button>
        {viewMode === 'overview' && (
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAddSlice}
            title={t('addNewSlice')}
          >
            +
          </button>
        )}
      </div>

      {/* Playback controls (only visible in Focus mode) */}
      <PlaybackControls />
    </div>
  );
}
