import { useGraphStore } from '@/store/graphStore';
import { useTranslation } from '@/hooks/useTranslation';

export function ViewModeToggle() {
  const viewMode = useGraphStore((state) => state.viewMode);
  const toggleViewMode = useGraphStore((state) => state.toggleViewMode);
  const { t } = useTranslation();

  return (
    <button
      className={`btn btn-sm ${viewMode === 'focus' ? 'btn-primary' : 'btn-secondary'}`}
      onClick={toggleViewMode}
      title={viewMode === 'overview' ? t('enterFocusMode') : t('exitToOverview')}
    >
      {viewMode === 'overview' ? t('focusMode') : t('overviewMode')}
    </button>
  );
}
