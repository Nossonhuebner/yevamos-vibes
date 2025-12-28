/**
 * Halacha Toggle Component
 *
 * Button to toggle halacha mode on/off.
 * Also shows current state and provides quick access to settings.
 */

import { useHalachaStore } from '@/store/halachaStore';

export function HalachaToggle() {
  const enabled = useHalachaStore((state) => state.enabled);
  const toggleHalachaMode = useHalachaStore((state) => state.toggleHalachaMode);
  const lockedPersonId = useHalachaStore((state) => state.lockedPersonId);
  const clearSelection = useHalachaStore((state) => state.clearSelection);
  const toggleStatusPanel = useHalachaStore((state) => state.toggleStatusPanel);
  const showStatusPanel = useHalachaStore((state) => state.showStatusPanel);

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: enabled ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${enabled ? '#a855f7' : '#334155'}`,
    borderRadius: '6px',
    color: enabled ? '#c4b5fd' : '#94a3b8',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '14px',
  };

  const handleToggle = () => {
    toggleHalachaMode();
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSelection();
  };

  const handleTogglePanel = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStatusPanel();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {/* Main toggle button */}
      <button
        style={buttonStyle}
        onClick={handleToggle}
        title={enabled ? 'Disable halacha mode' : 'Enable halacha mode'}
      >
        <span style={iconStyle}>📜</span>
        <span>Halacha</span>
        <span
          style={{
            fontSize: '9px',
            color: '#94a3b8',
            fontWeight: 400,
          }}
        >
          (Beta)
        </span>
        {enabled && (
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#a855f7',
            }}
          />
        )}
      </button>

      {/* Additional controls when enabled */}
      {enabled && (
        <>
          {/* Toggle panel button */}
          <button
            style={{
              ...buttonStyle,
              padding: '6px 8px',
              backgroundColor: showStatusPanel
                ? 'rgba(168, 85, 247, 0.15)'
                : 'rgba(255, 255, 255, 0.03)',
            }}
            onClick={handleTogglePanel}
            title={showStatusPanel ? 'Hide status panel' : 'Show status panel'}
          >
            <span style={iconStyle}>📋</span>
          </button>

          {/* Clear selection button (only when someone is locked) */}
          {lockedPersonId && (
            <button
              style={{
                ...buttonStyle,
                padding: '6px 8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: '#ef4444',
                color: '#fca5a5',
              }}
              onClick={handleClearSelection}
              title="Clear selection"
            >
              <span style={iconStyle}>✕</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Instruction overlay shown when halacha mode is active but no person is locked.
 */
export function HalachaInstructions() {
  const enabled = useHalachaStore((state) => state.enabled);
  const lockedPersonId = useHalachaStore((state) => state.lockedPersonId);
  const displayLanguage = useHalachaStore((state) => state.displayLanguage);

  if (!enabled || lockedPersonId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid #a855f7',
        borderRadius: '12px',
        padding: '24px 32px',
        textAlign: 'center',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontSize: '24px',
          marginBottom: '12px',
        }}
      >
        📜
      </div>
      <div
        style={{
          color: '#f8fafc',
          fontSize: '14px',
          fontWeight: 500,
          marginBottom: '8px',
        }}
      >
        {displayLanguage === 'he' ? 'מצב הלכה פעיל' : 'Halacha Mode Active'}
      </div>
      <div
        style={{
          color: '#94a3b8',
          fontSize: '12px',
        }}
      >
        {displayLanguage === 'he'
          ? 'לחץ על אדם לצפייה במעמדו ההלכתי'
          : 'Click a person to view their halachic status'}
      </div>
    </div>
  );
}
