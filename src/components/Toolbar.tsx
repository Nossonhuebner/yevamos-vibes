import { useGraphStore } from '@/store/graphStore';
import { exportToJson, importFromJson } from '@/utils/persistence';
import { useRef, useState } from 'react';
import { ViewModeToggle } from './ViewModeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useTranslation } from '@/hooks/useTranslation';

export function Toolbar() {
  const graph = useGraphStore((state) => state.graph);
  const loadGraph = useGraphStore((state) => state.loadGraph);
  const resetGraph = useGraphStore((state) => state.resetGraph);
  const updateMetadata = useGraphStore((state) => state.updateMetadata);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(graph.metadata.title);
  const { t, isRTL } = useTranslation();

  const handleExport = () => {
    exportToJson(graph);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imported = await importFromJson(file);
        loadGraph(imported);
      } catch (err) {
        alert(`${t('importFailed')} ${err}`);
      }
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (confirm(t('resetConfirm'))) {
      resetGraph();
      setTitleValue(t('untitledGraph'));
    }
  };

  const handleTitleSubmit = () => {
    if (titleValue.trim()) {
      updateMetadata({ title: titleValue.trim() });
    } else {
      setTitleValue(graph.metadata.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitleValue(graph.metadata.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="toolbar-overlay" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Graph title input */}
      {isEditingTitle ? (
        <input
          type="text"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={handleTitleSubmit}
          onKeyDown={handleTitleKeyDown}
          autoFocus
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #3b82f6',
            borderRadius: '4px',
            padding: '6px 12px',
            color: '#f1f5f9',
            fontSize: '14px',
            fontWeight: 600,
            outline: 'none',
            minWidth: '150px',
            direction: isRTL ? 'rtl' : 'ltr',
          }}
        />
      ) : (
        <div
          onClick={() => setIsEditingTitle(true)}
          style={{
            padding: '6px 12px',
            color: graph.metadata.title === t('untitledGraph') ? '#64748b' : '#f1f5f9',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'text',
            borderRadius: '4px',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
          }}
        >
          {graph.metadata.title}
        </div>
      )}

      <div style={{ width: '1px', height: '20px', backgroundColor: '#334155', margin: '0 8px' }} />

      <ViewModeToggle />

      <div style={{ width: '1px', height: '20px', backgroundColor: '#334155', margin: '0 8px' }} />

      <button className="btn btn-secondary btn-sm" onClick={handleExport}>
        {t('exportJson')}
      </button>
      <button className="btn btn-secondary btn-sm" onClick={handleImportClick}>
        {t('importJson')}
      </button>
      <button className="btn btn-danger btn-sm" onClick={handleReset}>
        {t('reset')}
      </button>

      <div style={{ width: '1px', height: '20px', backgroundColor: '#334155', margin: '0 8px' }} />

      <LanguageToggle />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: 'none' }}
      />
    </div>
  );
}
