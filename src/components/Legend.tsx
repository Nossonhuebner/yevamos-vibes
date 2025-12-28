import { useState } from 'react';
import { RelationshipType, RELATIONSHIP_STYLES } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

export function Legend() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t, tRelationship, isRTL } = useTranslation();

  const sectionStyle = {
    marginTop: '10px',
    paddingTop: '8px',
    borderTop: '1px solid #334155',
  };

  const headerStyle = {
    fontSize: '9px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '6px',
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    marginBottom: '4px',
  };

  const keyStyle = {
    fontSize: '10px',
    color: '#94a3b8',
    fontFamily: 'monospace',
    background: '#1e293b',
    padding: '1px 4px',
    borderRadius: '3px',
    minWidth: '50px',
  };

  return (
    <div
      className="legend-overlay"
      style={{
        maxWidth: isExpanded ? '200px' : '36px',
        padding: isExpanded ? '12px 14px' : '8px 10px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {!isExpanded ? (
        <span style={{ fontSize: '13px', fontWeight: 600 }} title={t('showLegend')}>?</span>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>Help</span>
            <span style={{ fontSize: '14px', opacity: 0.5, lineHeight: 1 }}>×</span>
          </div>

          {/* Quick Start */}
          <div style={headerStyle}>Getting Started</div>
          <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.4, marginBottom: '4px' }}>
            Right-click the canvas to add people. Select two people then right-click to create relationships.
          </div>

          {/* Controls */}
          <div style={sectionStyle}>
            <div style={headerStyle}>Controls</div>
            <div style={itemStyle}>
              <span style={keyStyle}>Click</span>
              <span style={{ color: '#e2e8f0' }}>Select person</span>
            </div>
            <div style={itemStyle}>
              <span style={keyStyle}>Right-click</span>
              <span style={{ color: '#e2e8f0' }}>Options menu</span>
            </div>
            <div style={itemStyle}>
              <span style={keyStyle}>⋮⋮ Drag</span>
              <span style={{ color: '#e2e8f0' }}>Move person</span>
            </div>
            <div style={itemStyle}>
              <span style={keyStyle}>Shift+Drag</span>
              <span style={{ color: '#e2e8f0' }}>Select multiple</span>
            </div>
            <div style={itemStyle}>
              <span style={keyStyle}>← →</span>
              <span style={{ color: '#e2e8f0' }}>Navigate slices</span>
            </div>
            <div style={itemStyle}>
              <span style={keyStyle}>Delete</span>
              <span style={{ color: '#e2e8f0' }}>Remove selected</span>
            </div>
            <div style={itemStyle}>
              <span style={keyStyle}>Esc</span>
              <span style={{ color: '#e2e8f0' }}>Clear selection</span>
            </div>
            <div style={itemStyle}>
              <span style={keyStyle}>Scroll</span>
              <span style={{ color: '#e2e8f0' }}>Zoom in/out</span>
            </div>
          </div>

          {/* Relationship Types */}
          <div style={sectionStyle}>
            <div style={headerStyle}>{t('relationships')}</div>
            {Object.entries(RELATIONSHIP_STYLES).map(([type, style]) => (
              <div key={type} style={{ ...itemStyle, marginBottom: '3px' }}>
                <div
                  style={{
                    backgroundColor: style.color,
                    borderStyle: style.lineStyle === 'dashed' ? 'dashed' : 'solid',
                    borderColor: style.color,
                    borderWidth: '1px',
                    height: Math.max(style.lineWidth, 3),
                    width: '16px',
                    borderRadius: '1px',
                  }}
                />
                <span style={{ color: '#cbd5e1', fontSize: '10px' }}>{tRelationship(type as RelationshipType)}</span>
              </div>
            ))}
          </div>

          {/* People */}
          <div style={sectionStyle}>
            <div style={headerStyle}>{t('people')}</div>
            <div style={{ ...itemStyle, marginBottom: '2px' }}>
              <span style={{ fontSize: '11px', width: '16px', textAlign: 'center' }}>👨</span>
              <span style={{ color: '#cbd5e1', fontSize: '10px' }}>{t('male')}</span>
            </div>
            <div style={{ ...itemStyle, marginBottom: '2px' }}>
              <span style={{ fontSize: '11px', width: '16px', textAlign: 'center' }}>👩</span>
              <span style={{ color: '#cbd5e1', fontSize: '10px' }}>{t('female')}</span>
            </div>
            <div style={{ ...itemStyle, marginBottom: '2px' }}>
              <span style={{ fontSize: '11px', width: '16px', textAlign: 'center', opacity: 0.4 }}>👤</span>
              <span style={{ color: '#cbd5e1', fontSize: '10px' }}>{t('deceased')}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
