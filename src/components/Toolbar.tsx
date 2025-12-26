import { useGraphStore } from '@/store/graphStore';
import { exportToJson, importFromJson, getShareableUrl } from '@/utils/persistence';
import { useRef, useState, useCallback } from 'react';
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
  const [linkCopiedToast, setLinkCopiedToast] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);
  const { t, isRTL } = useTranslation();

  const handleCopyLink = useCallback(async () => {
    try {
      const url = getShareableUrl(graph);
      await navigator.clipboard.writeText(url);

      // Show toast
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      setLinkCopiedToast(true);
      toastTimeoutRef.current = window.setTimeout(() => {
        setLinkCopiedToast(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }, [graph]);

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
    <>
      {/* Left toolbar - Graph title and controls */}
      <div className="toolbar-overlay" style={{ left: '20px', right: 'auto' }}>
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
              border: '1px solid #22d3ee',
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
              color: (graph.metadata.title === t('untitledGraph') || graph.metadata.title === 'Untitled Graph') ? '#64748b' : '#f1f5f9',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'text',
              borderRadius: '4px',
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
            }}
          >
            {graph.metadata.title === 'Untitled Graph' ? t('untitledGraph') : graph.metadata.title}
          </div>
        )}

        <div style={{ width: '1px', height: '20px', backgroundColor: '#2a2f3a', margin: '0 8px' }} />

        <button className="btn btn-secondary btn-sm" onClick={handleExport}>
          {t('exportJson')}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={handleImportClick}>
          {t('importJson')}
        </button>
        <button className="btn btn-danger btn-sm" onClick={handleReset}>
          {t('reset')}
        </button>

        <div style={{ width: '1px', height: '20px', backgroundColor: '#2a2f3a', margin: '0 8px' }} />

        <button className="btn btn-secondary btn-sm" onClick={handleCopyLink}>
          {t('copyLink')}
        </button>
      </div>

      {/* Right toolbar - Language toggle (always on right) */}
      <div className="toolbar-overlay" style={{ left: 'auto', right: '20px' }}>
        <LanguageToggle />
      </div>

      {/* Link copied toast */}
      {linkCopiedToast && (
        <div
          style={{
            position: 'fixed',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#34d399',
            color: '#e8e6e3',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 300,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {t('linkCopied')}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: 'none' }}
      />
    </>
  );
}
