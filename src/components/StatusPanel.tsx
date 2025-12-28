/**
 * Status Panel Component
 *
 * Side panel showing detailed halachic status information
 * when a person is locked and another is hovered.
 */

import { useMemo } from 'react';
import { useGraphStore, useCurrentResolvedState } from '@/store/graphStore';
import { useHalachaStore, useDisplayText } from '@/store/halachaStore';
import { StatusEngine } from '@/halacha/statusEngine';
import { ComputedStatus, AppliedStatus } from '@/halacha/types';

export function StatusPanel() {
  const enabled = useHalachaStore((state) => state.enabled);
  const lockedPersonId = useHalachaStore((state) => state.lockedPersonId);
  const hoveredPersonId = useHalachaStore((state) => state.hoveredPersonId);
  const showStatusPanel = useHalachaStore((state) => state.showStatusPanel);
  const opinionProfile = useHalachaStore((state) => state.opinionProfile);
  const registry = useHalachaStore((state) => state.registry);
  const displayLanguage = useHalachaStore((state) => state.displayLanguage);

  const graph = useGraphStore((state) => state.graph);
  const currentSliceIndex = useGraphStore((state) => state.currentSliceIndex);
  const resolvedState = useCurrentResolvedState();

  const getText = useDisplayText();

  // Compute status between locked and hovered person
  const status = useMemo((): ComputedStatus | null => {
    if (!enabled || !lockedPersonId || !hoveredPersonId) return null;

    const engine = new StatusEngine(graph, registry);
    return engine.computeStatus(
      lockedPersonId,
      hoveredPersonId,
      currentSliceIndex,
      opinionProfile
    );
  }, [
    enabled,
    lockedPersonId,
    hoveredPersonId,
    graph,
    registry,
    currentSliceIndex,
    opinionProfile,
  ]);

  // Get person names
  const lockedPerson = lockedPersonId ? resolvedState.nodes.get(lockedPersonId) : null;
  const hoveredPerson = hoveredPersonId ? resolvedState.nodes.get(hoveredPersonId) : null;

  if (!enabled || !showStatusPanel) return null;

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: '80px',
    right: '16px',
    width: '280px',
    maxHeight: 'calc(100vh - 160px)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '16px',
    color: '#f8fafc',
    fontSize: '12px',
    zIndex: 100,
    overflowY: 'auto',
    direction: displayLanguage === 'he' ? 'rtl' : 'ltr',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #334155',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  };

  if (!lockedPersonId) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          {displayLanguage === 'he' ? 'מצב הלכתי' : 'Halachic Status'}
        </div>
        <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
          {displayLanguage === 'he'
            ? 'לחץ על אדם לצפייה במעמדו'
            : 'Click a person to view their status'}
        </div>
      </div>
    );
  }

  if (!hoveredPersonId) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          {displayLanguage === 'he' ? 'מצב הלכתי' : 'Halachic Status'}
        </div>
        <div style={sectionStyle}>
          <div style={labelStyle}>
            {displayLanguage === 'he' ? 'נבחר' : 'Selected'}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>
            {lockedPerson?.name || lockedPersonId}
          </div>
        </div>
        <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
          {displayLanguage === 'he'
            ? 'העבר את העכבר על אדם אחר להשוואה'
            : 'Hover over another person to compare'}
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        {displayLanguage === 'he' ? 'מצב הלכתי' : 'Halachic Status'}
      </div>

      {/* People */}
      <div style={sectionStyle}>
        <div style={labelStyle}>
          {displayLanguage === 'he' ? 'השוואה' : 'Comparing'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 500 }}>{lockedPerson?.name}</span>
          <span style={{ color: '#64748b' }}>↔</span>
          <span style={{ fontWeight: 500 }}>{hoveredPerson?.name}</span>
        </div>
      </div>

      {/* Primary Status */}
      {status?.primaryStatus && (
        <div style={sectionStyle}>
          <div style={labelStyle}>
            {displayLanguage === 'he' ? 'מעמד ראשי' : 'Primary Status'}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              borderLeft: `3px solid ${
                registry.categories.find((c) => c.id === status.primaryStatus!.categoryId)
                  ?.color || '#64748b'
              }`,
            }}
          >
            <span style={{ fontWeight: 500 }}>
              {getText(status.primaryStatus.ruleName)}
            </span>
          </div>
        </div>
      )}

      {/* All Statuses */}
      {status && status.allStatuses.length > 0 && (
        <div style={sectionStyle}>
          <div style={labelStyle}>
            {displayLanguage === 'he' ? 'כל המעמדות' : 'All Statuses'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {status.allStatuses.map((s, idx) => (
              <StatusItem key={idx} status={s} displayLanguage={displayLanguage} />
            ))}
          </div>
        </div>
      )}

      {/* No Status */}
      {status && status.allStatuses.length === 0 && (
        <div style={sectionStyle}>
          <div
            style={{
              padding: '8px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '4px',
              borderLeft: '3px solid #22c55e',
              color: '#22c55e',
            }}
          >
            {displayLanguage === 'he' ? 'מותר' : 'Permitted'}
          </div>
        </div>
      )}

      {/* Zikah Info */}
      {status?.zikahInfo?.isZakuk && (
        <div style={sectionStyle}>
          <div style={labelStyle}>
            {displayLanguage === 'he' ? 'זיקה' : 'Zikah'}
          </div>
          <div
            style={{
              padding: '8px',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              borderRadius: '4px',
              borderLeft: '3px solid #a855f7',
            }}
          >
            <div style={{ color: '#a855f7', fontWeight: 500 }}>
              {displayLanguage === 'he' ? 'זיקה פעילה' : 'Active Zikah'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              {displayLanguage === 'he'
                ? `שומרת יבם (${status.zikahInfo.zekukaTo?.length || 0} יבמים)`
                : `Shomeres Yavam (${status.zikahInfo.zekukaTo?.length || 0} yevamim)`}
            </div>
          </div>
        </div>
      )}

      {/* Relevant Machlokos */}
      {status && status.relevantMachlokos.length > 0 && (
        <div style={sectionStyle}>
          <div style={labelStyle}>
            {displayLanguage === 'he' ? 'מחלוקות רלוונטיות' : 'Relevant Disputes'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {status.relevantMachlokos.map((rm, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                  {getText(rm.machlokas.title)}
                </div>
                <div style={{ color: '#94a3b8' }}>
                  {displayLanguage === 'he' ? 'דעה נבחרת: ' : 'Current: '}
                  <span style={{ color: '#e2e8f0' }}>
                    {getText(rm.currentSelection.position)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatusItemProps {
  status: AppliedStatus;
  displayLanguage: 'en' | 'he';
}

function StatusItem({ status, displayLanguage }: StatusItemProps) {
  const getText = (field: { en: string; he: string } | undefined): string => {
    if (!field) return '';
    return field[displayLanguage];
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 8px',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '4px',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: status.category.color,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: '11px' }}>
          {getText(status.statusName)}
        </div>
        <div style={{ fontSize: '10px', color: '#64748b' }}>
          {getText(status.category.name)} ({status.category.level})
        </div>
      </div>
    </div>
  );
}
