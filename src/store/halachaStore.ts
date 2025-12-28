/**
 * Halacha Store
 *
 * Zustand store for managing halachic overlay state.
 * Separate from the main graph store to keep concerns isolated.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  OpinionProfile,
  HalachicRegistry,
} from '@/halacha/types';
import { SAMPLE_REGISTRY } from '@/halacha/data/sampleRules';

// ═══════════════════════════════════════════════════════════════════════════
// Store State Interface
// ═══════════════════════════════════════════════════════════════════════════

interface HalachaStoreState {
  /**
   * Whether halacha mode is enabled.
   */
  enabled: boolean;

  /**
   * Person currently locked for status viewing.
   * When set, shows status lines to all other people.
   */
  lockedPersonId: string | null;

  /**
   * Person currently being hovered (for detailed comparison).
   */
  hoveredPersonId: string | null;

  /**
   * Current opinion profile.
   */
  opinionProfile: OpinionProfile;

  /**
   * Available opinion profiles.
   */
  savedProfiles: OpinionProfile[];

  /**
   * Halachic registry (rules, machlokos, categories).
   */
  registry: HalachicRegistry;

  /**
   * Show the opinion selector modal.
   */
  showOpinionSelector: boolean;

  /**
   * Show the status panel (side panel with details).
   */
  showStatusPanel: boolean;

  /**
   * Display language for halachic content.
   */
  displayLanguage: 'en' | 'he';
}

interface HalachaStoreActions {
  // Toggle mode
  toggleHalachaMode: () => void;
  setEnabled: (enabled: boolean) => void;

  // Person selection
  setLockedPerson: (personId: string | null) => void;
  setHoveredPerson: (personId: string | null) => void;
  clearSelection: () => void;

  // Opinion profile management
  setOpinionProfile: (profile: OpinionProfile) => void;
  updateOpinionSelection: (machlokasId: string, opinionId: string) => void;
  saveCurrentProfile: (name: string) => void;
  loadProfile: (profileId: string) => void;
  deleteProfile: (profileId: string) => void;

  // Registry management
  setRegistry: (registry: HalachicRegistry) => void;
  addRule: (rule: HalachicRegistry['rules'][0]) => void;
  addMachlokas: (machlokas: HalachicRegistry['machlokos'][0]) => void;

  // UI toggles
  toggleOpinionSelector: () => void;
  setShowOpinionSelector: (show: boolean) => void;
  toggleStatusPanel: () => void;
  setShowStatusPanel: (show: boolean) => void;

  // Display
  setDisplayLanguage: (lang: 'en' | 'he') => void;

  // Reset
  reset: () => void;
}

type HalachaStore = HalachaStoreState & HalachaStoreActions;

// ═══════════════════════════════════════════════════════════════════════════
// Default State
// ═══════════════════════════════════════════════════════════════════════════

const defaultOpinionProfile: OpinionProfile = {
  id: 'default',
  name: 'Default',
  description: 'Default opinion selections',
  selections: {},
  lastModified: Date.now(),
};

const initialState: HalachaStoreState = {
  enabled: false,
  lockedPersonId: null,
  hoveredPersonId: null,
  opinionProfile: defaultOpinionProfile,
  savedProfiles: [defaultOpinionProfile],
  registry: SAMPLE_REGISTRY,
  showOpinionSelector: false,
  showStatusPanel: false,
  displayLanguage: 'en',
};

// ═══════════════════════════════════════════════════════════════════════════
// Store Creation
// ═══════════════════════════════════════════════════════════════════════════

export const useHalachaStore = create<HalachaStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // ─────────────────────────────────────────────────────────────────────
      // Toggle Mode
      // ─────────────────────────────────────────────────────────────────────

      toggleHalachaMode: () => {
        const current = get().enabled;
        set({
          enabled: !current,
          // Clear selection when disabling
          lockedPersonId: current ? null : get().lockedPersonId,
          hoveredPersonId: current ? null : get().hoveredPersonId,
        });
      },

      setEnabled: (enabled) => {
        set({
          enabled,
          // Clear selection when disabling
          lockedPersonId: enabled ? get().lockedPersonId : null,
          hoveredPersonId: enabled ? get().hoveredPersonId : null,
        });
      },

      // ─────────────────────────────────────────────────────────────────────
      // Person Selection
      // ─────────────────────────────────────────────────────────────────────

      setLockedPerson: (personId) => {
        set({ lockedPersonId: personId });
      },

      setHoveredPerson: (personId) => {
        set({ hoveredPersonId: personId });
      },

      clearSelection: () => {
        set({
          lockedPersonId: null,
          hoveredPersonId: null,
        });
      },

      // ─────────────────────────────────────────────────────────────────────
      // Opinion Profile Management
      // ─────────────────────────────────────────────────────────────────────

      setOpinionProfile: (profile) => {
        set({ opinionProfile: profile });
      },

      updateOpinionSelection: (machlokasId, opinionId) => {
        const current = get().opinionProfile;
        set({
          opinionProfile: {
            ...current,
            selections: {
              ...current.selections,
              [machlokasId]: opinionId,
            },
            lastModified: Date.now(),
          },
        });
      },

      saveCurrentProfile: (name) => {
        const current = get().opinionProfile;
        const newProfile: OpinionProfile = {
          ...current,
          id: `profile-${Date.now()}`,
          name,
          lastModified: Date.now(),
        };

        set((state) => ({
          savedProfiles: [...state.savedProfiles, newProfile],
          opinionProfile: newProfile,
        }));
      },

      loadProfile: (profileId) => {
        const profile = get().savedProfiles.find((p) => p.id === profileId);
        if (profile) {
          set({ opinionProfile: profile });
        }
      },

      deleteProfile: (profileId) => {
        // Don't delete the default profile
        if (profileId === 'default') return;

        const profiles = get().savedProfiles.filter((p) => p.id !== profileId);
        const current = get().opinionProfile;

        set({
          savedProfiles: profiles,
          // If current profile was deleted, switch to default
          opinionProfile:
            current.id === profileId
              ? profiles.find((p) => p.id === 'default') || profiles[0]
              : current,
        });
      },

      // ─────────────────────────────────────────────────────────────────────
      // Registry Management
      // ─────────────────────────────────────────────────────────────────────

      setRegistry: (registry) => {
        set({ registry });
      },

      addRule: (rule) => {
        set((state) => ({
          registry: {
            ...state.registry,
            rules: [...state.registry.rules, rule],
          },
        }));
      },

      addMachlokas: (machlokas) => {
        set((state) => ({
          registry: {
            ...state.registry,
            machlokos: [...state.registry.machlokos, machlokas],
          },
        }));
      },

      // ─────────────────────────────────────────────────────────────────────
      // UI Toggles
      // ─────────────────────────────────────────────────────────────────────

      toggleOpinionSelector: () => {
        set((state) => ({ showOpinionSelector: !state.showOpinionSelector }));
      },

      setShowOpinionSelector: (show) => {
        set({ showOpinionSelector: show });
      },

      toggleStatusPanel: () => {
        set((state) => ({ showStatusPanel: !state.showStatusPanel }));
      },

      setShowStatusPanel: (show) => {
        set({ showStatusPanel: show });
      },

      // ─────────────────────────────────────────────────────────────────────
      // Display
      // ─────────────────────────────────────────────────────────────────────

      setDisplayLanguage: (lang) => {
        set({ displayLanguage: lang });
      },

      // ─────────────────────────────────────────────────────────────────────
      // Reset
      // ─────────────────────────────────────────────────────────────────────

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'yevamos-halacha-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist these fields
        opinionProfile: state.opinionProfile,
        savedProfiles: state.savedProfiles,
        displayLanguage: state.displayLanguage,
        // Don't persist UI state or registry (registry should be loaded fresh)
      }),
    }
  )
);

// ═══════════════════════════════════════════════════════════════════════════
// Selectors
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if halacha mode is active with a locked person.
 */
export const selectIsHalachaActive = (state: HalachaStore): boolean =>
  state.enabled && state.lockedPersonId !== null;

/**
 * Get the currently selected pair for status display.
 */
export const selectStatusPair = (
  state: HalachaStore
): { personA: string; personB: string } | null => {
  if (!state.enabled || !state.lockedPersonId) return null;
  if (!state.hoveredPersonId) return null;
  return {
    personA: state.lockedPersonId,
    personB: state.hoveredPersonId,
  };
};

/**
 * Get the display text for a bilingual field.
 */
export const getDisplayText = (
  field: { en: string; he: string } | undefined,
  language: 'en' | 'he'
): string => {
  if (!field) return '';
  return field[language];
};

// ═══════════════════════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to get display text helper bound to current language.
 */
export function useDisplayText() {
  const language = useHalachaStore((state) => state.displayLanguage);
  return (field: { en: string; he: string } | undefined): string =>
    getDisplayText(field, language);
}

/**
 * Hook to check if halacha mode is enabled.
 */
export function useHalachaEnabled() {
  return useHalachaStore((state) => state.enabled);
}

/**
 * Hook to get the locked person for status display.
 */
export function useLockedPerson() {
  return useHalachaStore((state) => state.lockedPersonId);
}

/**
 * Hook to get the current opinion profile.
 */
export function useOpinionProfile() {
  return useHalachaStore((state) => state.opinionProfile);
}
