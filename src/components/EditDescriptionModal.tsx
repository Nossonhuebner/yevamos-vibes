import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface EditDescriptionModalProps {
  currentLabel: string;
  onClose: () => void;
  onSubmit: (label: string) => void;
}

export function EditDescriptionModal({
  currentLabel,
  onClose,
  onSubmit,
}: EditDescriptionModalProps) {
  const [value, setValue] = useState(currentLabel);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t, isRTL } = useTranslation();

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    } else {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 200,
        }}
        onClick={onClose}
      />

      {/* Modal - positioned above the click point */}
      <div
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#151922',
          border: '1px solid #2a2f3a',
          borderRadius: '8px',
          padding: '16px',
          zIndex: 201,
          minWidth: '450px',
          maxWidth: '90vw',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', color: '#e8e6e3', fontSize: '14px' }}>
          {t('editDescription')}
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t('enterDescription')}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#0c0f14',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#e8e6e3',
                fontSize: '15px',
                lineHeight: '1.5',
                outline: 'none',
                boxSizing: 'border-box',
                direction: isRTL ? 'rtl' : 'ltr',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
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
              style={{
                padding: '8px 16px',
                backgroundColor: '#34d399',
                border: 'none',
                borderRadius: '4px',
                color: '#e8e6e3',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
