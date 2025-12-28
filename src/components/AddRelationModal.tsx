import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

type RelationType = 'marriage' | 'unmarried';

interface AddRelationModalProps {
  isOpen: boolean;
  personAName: string;
  personBName: string;
  onClose: () => void;
  onSubmit: (type: 'unmarried-relations' | 'erusin' | 'nisuin') => void;
}

export function AddRelationModal({
  isOpen,
  personAName,
  personBName,
  onClose,
  onSubmit,
}: AddRelationModalProps) {
  const [relationType, setRelationType] = useState<RelationType>('marriage');
  const [includeErusin, setIncludeErusin] = useState(true);
  const [includeNisuin, setIncludeNisuin] = useState(true);
  const [showMarriageOptions, setShowMarriageOptions] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { t, isRTL } = useTranslation();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRelationType('marriage');
      setIncludeErusin(true);
      setIncludeNisuin(true);
      setShowMarriageOptions(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (relationType === 'unmarried') {
      onSubmit('unmarried-relations');
    } else {
      // Marriage - determine which type based on checkboxes
      if (includeNisuin) {
        onSubmit('nisuin');
      } else if (includeErusin) {
        onSubmit('erusin');
      }
    }
    onClose();
  };

  // Handle nisuin checkbox - if nisuin is checked, erusin must also be checked
  const handleNisuinChange = (checked: boolean) => {
    setIncludeNisuin(checked);
    if (checked && !includeErusin) {
      setIncludeErusin(true);
    }
  };

  // Handle erusin checkbox - if erusin is unchecked, nisuin must also be unchecked
  const handleErusinChange = (checked: boolean) => {
    setIncludeErusin(checked);
    if (!checked && includeNisuin) {
      setIncludeNisuin(false);
    }
  };

  const canSubmit = relationType === 'unmarried' || (relationType === 'marriage' && (includeErusin || includeNisuin));

  if (!isOpen) return null;

  const radioStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#e8e6e3',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid',
    marginBottom: '8px',
    transition: 'all 0.15s ease',
  };

  return (
    <div
      ref={modalRef}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#151922',
        border: '1px solid #2a2f3a',
        borderRadius: '8px',
        padding: '20px',
        zIndex: 200,
        minWidth: '340px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', color: '#e8e6e3', fontSize: '16px' }}>
        {t('addRelation')}
      </h3>
      <p style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '14px' }}>
        {personAName} & {personBName}
      </p>

      <form onSubmit={handleSubmit}>
        {/* Relationship Type Selection */}
        <div style={{ marginBottom: '16px' }}>
          {/* Marriage Option */}
          <label
            style={{
              ...radioStyle,
              borderColor: relationType === 'marriage' ? '#f472b6' : '#2a2f3a',
              backgroundColor: relationType === 'marriage' ? 'rgba(244, 114, 182, 0.1)' : 'transparent',
            }}
          >
            <input
              type="radio"
              name="relationType"
              checked={relationType === 'marriage'}
              onChange={() => setRelationType('marriage')}
              style={{ accentColor: '#f472b6', width: '16px', height: '16px' }}
            />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 500 }}>{t('marriage')}</span>
              <span style={{ color: '#64748b', marginLeft: '8px', fontSize: '12px' }}>
                (Erusin & Nisuin)
              </span>
            </div>
            {relationType === 'marriage' && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowMarriageOptions(!showMarriageOptions);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px 6px',
                }}
              >
                {showMarriageOptions ? '▲' : '▼'} Options
              </button>
            )}
          </label>

          {/* Marriage Options (collapsible) */}
          {relationType === 'marriage' && showMarriageOptions && (
            <div
              style={{
                marginLeft: '28px',
                marginBottom: '12px',
                padding: '12px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#e8e6e3',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '10px',
                }}
              >
                <input
                  type="checkbox"
                  checked={includeErusin}
                  onChange={(e) => handleErusinChange(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#f472b6',
                    cursor: 'pointer',
                  }}
                />
                <span>
                  {t('erusin')}
                  <span style={{ color: '#64748b', marginLeft: '6px', fontSize: '11px' }}>
                    ({t('erusinDescription')})
                  </span>
                </span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#e8e6e3',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={includeNisuin}
                  onChange={(e) => handleNisuinChange(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#7dd3fc',
                    cursor: 'pointer',
                  }}
                />
                <span>
                  {t('nisuin')}
                  <span style={{ color: '#64748b', marginLeft: '6px', fontSize: '11px' }}>
                    ({t('nisuinDescription')})
                  </span>
                </span>
              </label>
            </div>
          )}

          {/* Unmarried Relations Option */}
          <label
            style={{
              ...radioStyle,
              borderColor: relationType === 'unmarried' ? '#fb923c' : '#2a2f3a',
              backgroundColor: relationType === 'unmarried' ? 'rgba(251, 146, 60, 0.1)' : 'transparent',
            }}
          >
            <input
              type="radio"
              name="relationType"
              checked={relationType === 'unmarried'}
              onChange={() => setRelationType('unmarried')}
              style={{ accentColor: '#fb923c', width: '16px', height: '16px' }}
            />
            <div>
              <span style={{ fontWeight: 500 }}>{t('unmarriedRelations')}</span>
              <span style={{ color: '#64748b', marginLeft: '8px', fontSize: '12px' }}>
                (No kiddushin)
              </span>
            </div>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #2a2f3a',
              borderRadius: '4px',
              color: '#9ca3af',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              padding: '8px 16px',
              backgroundColor: canSubmit
                ? (relationType === 'marriage' ? '#f472b6' : '#fb923c')
                : '#475569',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {t('create')}
          </button>
        </div>
      </form>
    </div>
  );
}
