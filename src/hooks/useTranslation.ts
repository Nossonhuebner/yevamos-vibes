import { useGraphStore } from '@/store/graphStore';
import { translations, TranslationKey, relationshipTypeToKey } from '@/i18n/translations';
import { RelationshipType } from '@/types';

/**
 * Hook for accessing translations based on current language setting.
 */
export function useTranslation() {
  const language = useGraphStore((state) => state.language);

  const t = (key: TranslationKey): string => {
    return translations[language][key];
  };

  // Helper for relationship type labels
  const tRelationship = (type: RelationshipType): string => {
    const key = relationshipTypeToKey[type];
    return key ? translations[language][key] : type;
  };

  // Check if current language is RTL
  const isRTL = language === 'he';

  return { t, tRelationship, language, isRTL };
}
