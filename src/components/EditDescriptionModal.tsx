import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface EditDescriptionModalProps {
  position: { x: number; y: number };
  currentLabel: string;
  onClose: () => void;
  onSubmit: (label: string) => void;
}

export function EditDescriptionModal({
  position,
  currentLabel,
  onClose,
  onSubmit,
}: EditDescriptionModalProps) {
  const [value, setValue] = useState(currentLabel);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t, isRTL } = useTranslation();

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
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

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          backgroundColor: '#151922',
          border: '1px solid #2a2f3a',
          borderRadius: '8px',
          padding: '16px',
          zIndex: 201,
          minWidth: '300px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', color: '#e8e6e3', fontSize: '14px' }}>
          {t('editDescription')}
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t('enterDescription')}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#0c0f14',
                border: '1px solid #2a2f3a',
                borderRadius: '4px',
                color: '#e8e6e3',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                direction: isRTL ? 'rtl' : 'ltr',
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
                color: '#8a8a8a',
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
                backgroundColor: '#5fa052',
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
