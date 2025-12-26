import { useState } from 'react';
import { RelationshipType, RELATIONSHIP_STYLES } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

export function Legend() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t, tRelationship, isRTL } = useTranslation();

  return (
    <div
      className="legend-overlay"
      style={{
        maxWidth: isExpanded ? '180px' : '40px',
        padding: isExpanded ? '10px 12px' : '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {!isExpanded ? (
        <span style={{ fontSize: '14px' }} title={t('showLegend')}>?</span>
      ) : (
        <>
          <h4 style={{ marginBottom: '6px', fontSize: '10px' }}>
            {t('relationships')}
            <span style={{ float: isRTL ? 'left' : 'right', opacity: 0.5 }}>×</span>
          </h4>
          <div className="legend-items" style={{ gap: '3px' }}>
            {Object.entries(RELATIONSHIP_STYLES).map(([type, style]) => (
              <div key={type} className="legend-item" style={{ gap: '6px', fontSize: '10px' }}>
                <div
                  className="legend-color"
                  style={{
                    backgroundColor: style.color,
                    borderStyle: style.lineStyle === 'dashed' ? 'dashed' : 'solid',
                    height: style.lineWidth * 1.5,
                    width: '14px',
                    minHeight: '2px',
                  }}
                />
                <span>{tRelationship(type as RelationshipType)}</span>
              </div>
            ))}
          </div>
          <h4 style={{ marginTop: '8px', marginBottom: '4px', fontSize: '10px' }}>{t('people')}</h4>
          <div className="legend-items" style={{ gap: '2px' }}>
            <div className="legend-item" style={{ gap: '6px', fontSize: '10px' }}>
              <span style={{ fontSize: '12px' }}>♂</span>
              <span>{t('male')}</span>
            </div>
            <div className="legend-item" style={{ gap: '6px', fontSize: '10px' }}>
              <span style={{ fontSize: '12px' }}>♀</span>
              <span>{t('female')}</span>
            </div>
            <div className="legend-item" style={{ gap: '6px', fontSize: '10px' }}>
              <span style={{ fontSize: '12px', opacity: 0.5 }}>✝</span>
              <span>{t('deceased')}</span>
            </div>
          </div>
          <h4 style={{ marginTop: '8px', marginBottom: '4px', fontSize: '10px' }}>{t('controls')}</h4>
          <div className="legend-items" style={{ gap: '2px' }}>
            <div className="legend-item" style={{ gap: '4px', fontSize: '10px' }}>
              <span style={{ color: '#64748b', fontSize: '9px' }}>{t('dragHandle')} ⋮⋮</span>
              <span>{t('moveNode')}</span>
            </div>
            <div className="legend-item" style={{ gap: '4px', fontSize: '10px' }}>
              <span style={{ color: '#64748b', fontSize: '9px' }}>{t('shiftDrag')}</span>
              <span>{t('multiSelect')}</span>
            </div>
            <div className="legend-item" style={{ gap: '4px', fontSize: '10px' }}>
              <span style={{ color: '#64748b', fontSize: '9px' }}>{t('clickNode')}</span>
              <span>{t('selectForRelationship')}</span>
            </div>
            <div className="legend-item" style={{ gap: '4px', fontSize: '10px', color: '#3b82f6' }}>
              <span style={{ fontSize: '9px' }}>{t('rightClick')}</span>
              <span>{t('optionsMenu')}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
