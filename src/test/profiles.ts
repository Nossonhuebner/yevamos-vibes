/**
 * Opinion Profiles for Testing
 *
 * Pre-built opinion profiles for testing machlokas variations.
 */

import { OpinionProfile, HalachicRegistry } from '@/halacha/types';
import { SAMPLE_REGISTRY } from '@/halacha/data/sampleRules';
import { createDefaultOpinionProfile } from '@/halacha/statusEngine';

/**
 * Default opinion profile using the sample registry's default opinions.
 */
export const DEFAULT_PROFILE: OpinionProfile = createDefaultOpinionProfile(SAMPLE_REGISTRY);

/**
 * Create a profile with a specific opinion selected for a machlokas.
 * Starts from the default profile and overrides the specified machlokas.
 */
export function profileWith(
  machlokasId: string,
  opinionId: string,
  baseProfile: OpinionProfile = DEFAULT_PROFILE
): OpinionProfile {
  return {
    ...baseProfile,
    id: `${baseProfile.id}-with-${machlokasId}-${opinionId}`,
    name: `${baseProfile.name} (${machlokasId}=${opinionId})`,
    selections: {
      ...baseProfile.selections,
      [machlokasId]: opinionId,
    },
  };
}

/**
 * Create a profile with multiple opinions selected.
 */
export function profileWithSelections(
  selections: Record<string, string>,
  baseProfile: OpinionProfile = DEFAULT_PROFILE
): OpinionProfile {
  return {
    ...baseProfile,
    id: `custom-${Date.now()}`,
    name: 'Custom Profile',
    selections: {
      ...baseProfile.selections,
      ...selections,
    },
  };
}

/**
 * Create a fresh default profile from a registry.
 * Use when testing with a custom registry.
 */
export function defaultProfileFor(registry: HalachicRegistry): OpinionProfile {
  return createDefaultOpinionProfile(registry);
}

/**
 * Known machlokas IDs for convenience.
 * Add more as needed.
 */
export const MACHLOKAS = {
  YESH_ZIKAH: 'yesh-zikah',
  // Add more machlokas IDs as they're defined in sampleRules
} as const;
