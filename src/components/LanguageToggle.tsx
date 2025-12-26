import { useGraphStore } from '@/store/graphStore';

export function LanguageToggle() {
  const language = useGraphStore((state) => state.language);
  const toggleLanguage = useGraphStore((state) => state.toggleLanguage);

  return (
    <button
      className="btn btn-secondary btn-sm"
      onClick={toggleLanguage}
      title={language === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
      style={{ minWidth: '45px' }}
    >
      {language === 'en' ? 'עב' : 'EN'}
    </button>
  );
}
