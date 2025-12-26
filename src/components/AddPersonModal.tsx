import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface AddPersonModalProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onSubmit: (name: string, gender: 'male' | 'female') => void;
  titleKey?: 'addPerson' | 'addChild';
}

export function AddPersonModal({ isOpen, position, onClose, onSubmit, titleKey = 'addPerson' }: AddPersonModalProps) {
  const { t, isRTL } = useTranslation();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setName('');
      setGender('male');
      setTimeout(() => inputRef.current?.focus(), 0);
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), gender);
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
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '16px',
          zIndex: 201,
          minWidth: '250px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', color: '#f1f5f9', fontSize: '14px' }}>
          {t(titleKey)}
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '12px',
                marginBottom: '4px',
              }}
            >
              {t('name')} *
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('enterName')}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: '#f1f5f9',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                direction: isRTL ? 'rtl' : 'ltr',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '12px',
                marginBottom: '4px',
              }}
            >
              {t('gender')} *
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setGender('male')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: gender === 'male' ? '#3b82f6' : '#0f172a',
                  border: `1px solid ${gender === 'male' ? '#3b82f6' : '#334155'}`,
                  borderRadius: '4px',
                  color: '#f1f5f9',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {t('male')}
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: gender === 'female' ? '#ec4899' : '#0f172a',
                  border: `1px solid ${gender === 'female' ? '#ec4899' : '#334155'}`,
                  borderRadius: '4px',
                  color: '#f1f5f9',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {t('female')}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: '#94a3b8',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: name.trim() ? '#22c55e' : '#334155',
                border: 'none',
                borderRadius: '4px',
                color: name.trim() ? '#fff' : '#64748b',
                fontSize: '14px',
                cursor: name.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {t('add')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
