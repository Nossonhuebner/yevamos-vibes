/**
 * Mobile Navigation Component
 *
 * Hamburger menu that opens a side drawer on mobile devices.
 * Contains all the toolbar controls that would otherwise be jumbled.
 */

import { useState, useRef, useEffect } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { exportToJson, importFromJson, getShareableUrl } from '@/utils/persistence';
import { LanguageToggle } from './LanguageToggle';
import { HalachaToggle } from './HalachaToggle';
import { useTranslation } from '@/hooks/useTranslation';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const graph = useGraphStore((state) => state.graph);
  const loadGraph = useGraphStore((state) => state.loadGraph);
  const resetGraph = useGraphStore((state) => state.resetGraph);
  const updateMetadata = useGraphStore((state) => state.updateMetadata);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(graph.metadata.title);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const { t, isRTL } = useTranslation();

  // Update title value when graph changes
  useEffect(() => {
    setTitleValue(graph.metadata.title);
  }, [graph.metadata.title]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && !target.closest('.mobile-nav-drawer') && !target.closest('.mobile-nav-toggle')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2000);
  };

  const handleCopyLink = async () => {
    try {
      const url = getShareableUrl(graph);
      await navigator.clipboard.writeText(url);
      showToast(t('linkCopied'));
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleExport = () => {
    exportToJson(graph);
    setIsOpen(false);
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
        setIsOpen(false);
      } catch (err) {
        alert(`${t('importFailed')} ${err}`);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (confirm(t('resetConfirm'))) {
      resetGraph();
      setTitleValue(t('untitledGraph'));
      setIsOpen(false);
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

  return (
    <>
      {/* Hamburger button */}
      <button
        className="mobile-nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <div className={`hamburger ${isOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* Overlay */}
      {isOpen && <div className="mobile-nav-overlay" onClick={() => setIsOpen(false)} />}

      {/* Slide-out drawer */}
      <div className={`mobile-nav-drawer ${isOpen ? 'open' : ''}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        <div className="mobile-nav-header">
          <h2>{t('menu') || 'Menu'}</h2>
          <button className="mobile-nav-close" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        </div>

        <div className="mobile-nav-content">
          {/* Graph Title */}
          <div className="mobile-nav-section">
            <label className="mobile-nav-label">{t('graphTitle') || 'Graph Title'}</label>
            {isEditingTitle ? (
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setTitleValue(graph.metadata.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="mobile-nav-input"
              />
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="mobile-nav-title-display"
              >
                {graph.metadata.title === 'Untitled Graph' ? t('untitledGraph') : graph.metadata.title}
              </div>
            )}
          </div>

          {/* Halacha Toggle */}
          <div className="mobile-nav-section">
            <label className="mobile-nav-label">{t('halachaMode') || 'Halacha Mode'}</label>
            <HalachaToggle />
          </div>

          {/* Language Toggle */}
          <div className="mobile-nav-section">
            <label className="mobile-nav-label">{t('language') || 'Language'}</label>
            <LanguageToggle />
          </div>

          {/* File Operations */}
          <div className="mobile-nav-section">
            <label className="mobile-nav-label">{t('fileOperations') || 'File Operations'}</label>
            <div className="mobile-nav-buttons">
              <button className="btn btn-secondary" onClick={handleExport}>
                {t('exportJson')}
              </button>
              <button className="btn btn-secondary" onClick={handleImportClick}>
                {t('importJson')}
              </button>
              <button className="btn btn-secondary" onClick={handleCopyLink}>
                {t('copyLink')}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mobile-nav-section mobile-nav-danger">
            <button className="btn btn-danger" onClick={handleReset}>
              {t('reset')}
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast.visible && (
          <div className="mobile-nav-toast">
            {toast.message}
          </div>
        )}
      </div>

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
