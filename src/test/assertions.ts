/**
 * Test Assertions for Halachic Status
 *
 * Custom assertion helpers that provide clear error messages
 * and work with the StatusEngine API.
 */

import { expect } from 'vitest';
import { StatusEngine } from '@/halacha/statusEngine';
import { OpinionProfile, ComputedStatus } from '@/halacha/types';

/**
 * Assert that person A has a specific status category toward person B.
 */
export function expectStatus(
  engine: StatusEngine,
  fromId: string,
  toId: string,
  sliceIndex: number,
  profile: OpinionProfile,
  expectedCategoryId: string,
  message?: string
): void {
  const status = engine.computeStatus(fromId, toId, sliceIndex, profile);

  const hasCategory = status.allStatuses.some(
    (s) => s.category.id === expectedCategoryId
  );

  if (!hasCategory) {
    const foundCategories = status.allStatuses.map((s) => s.category.id);
    const errorMsg = message
      ? `${message}: Expected status "${expectedCategoryId}" but found: [${foundCategories.join(', ') || 'none'}]`
      : `Expected ${fromId} → ${toId} to have status "${expectedCategoryId}" at slice ${sliceIndex}, but found: [${foundCategories.join(', ') || 'none'}]`;
    expect.fail(errorMsg);
  }
}

/**
 * Assert that person A does NOT have a specific status category toward person B.
 */
export function expectNoStatus(
  engine: StatusEngine,
  fromId: string,
  toId: string,
  sliceIndex: number,
  profile: OpinionProfile,
  categoryId: string,
  message?: string
): void {
  const status = engine.computeStatus(fromId, toId, sliceIndex, profile);

  const hasCategory = status.allStatuses.some(
    (s) => s.category.id === categoryId
  );

  if (hasCategory) {
    const matchingStatus = status.allStatuses.find(
      (s) => s.category.id === categoryId
    );
    const errorMsg = message
      ? `${message}: Did not expect status "${categoryId}" but found it via rule "${matchingStatus?.ruleId}"`
      : `Did not expect ${fromId} → ${toId} to have status "${categoryId}" at slice ${sliceIndex}, but found it via rule "${matchingStatus?.ruleId}"`;
    expect.fail(errorMsg);
  }
}

/**
 * Assert that the primary status is a specific category.
 */
export function expectPrimaryStatus(
  engine: StatusEngine,
  fromId: string,
  toId: string,
  sliceIndex: number,
  profile: OpinionProfile,
  expectedCategoryId: string,
  message?: string
): void {
  const status = engine.computeStatus(fromId, toId, sliceIndex, profile);

  const actualCategoryId = status.primaryStatus?.categoryId ?? 'none';

  if (actualCategoryId !== expectedCategoryId) {
    const errorMsg = message
      ? `${message}: Expected primary status "${expectedCategoryId}" but got "${actualCategoryId}"`
      : `Expected ${fromId} → ${toId} primary status to be "${expectedCategoryId}" at slice ${sliceIndex}, but got "${actualCategoryId}"`;
    expect.fail(errorMsg);
  }
}

/**
 * Assert that marriage is permitted between two people.
 */
export function expectMarriagePermitted(
  engine: StatusEngine,
  fromId: string,
  toId: string,
  sliceIndex: number,
  profile: OpinionProfile,
  message?: string
): void {
  const permitted = engine.isMarriagePermitted(fromId, toId, sliceIndex, profile);

  if (!permitted) {
    const status = engine.computeStatus(fromId, toId, sliceIndex, profile);
    const reasons = status.allStatuses.map((s) => s.statusName.en);
    const errorMsg = message
      ? `${message}: Marriage not permitted due to: ${reasons.join(', ')}`
      : `Expected marriage between ${fromId} and ${toId} to be permitted at slice ${sliceIndex}, but forbidden due to: ${reasons.join(', ')}`;
    expect.fail(errorMsg);
  }
}

/**
 * Assert that marriage is forbidden between two people.
 */
export function expectMarriageForbidden(
  engine: StatusEngine,
  fromId: string,
  toId: string,
  sliceIndex: number,
  profile: OpinionProfile,
  message?: string
): void {
  const permitted = engine.isMarriagePermitted(fromId, toId, sliceIndex, profile);

  if (permitted) {
    const errorMsg = message
      ? `${message}: Marriage unexpectedly permitted`
      : `Expected marriage between ${fromId} and ${toId} to be forbidden at slice ${sliceIndex}, but it was permitted`;
    expect.fail(errorMsg);
  }
}

/**
 * Assert that zikah exists between yavam and yevama.
 */
export function expectZikah(
  engine: StatusEngine,
  yavamId: string,
  yevamaId: string,
  sliceIndex: number,
  message?: string
): void {
  const yevamim = engine.getYevamimFor(yevamaId, sliceIndex);
  const hasZikah = yevamim.some((y) => y.id === yavamId);

  if (!hasZikah) {
    const availableYevamim = yevamim.map((y) => y.id);
    const errorMsg = message
      ? `${message}: No zikah found. Available yevamim: [${availableYevamim.join(', ') || 'none'}]`
      : `Expected zikah between yavam ${yavamId} and yevama ${yevamaId} at slice ${sliceIndex}, but not found. Available yevamim: [${availableYevamim.join(', ') || 'none'}]`;
    expect.fail(errorMsg);
  }
}

/**
 * Assert that zikah does NOT exist between yavam and yevama.
 */
export function expectNoZikah(
  engine: StatusEngine,
  yavamId: string,
  yevamaId: string,
  sliceIndex: number,
  message?: string
): void {
  const yevamim = engine.getYevamimFor(yevamaId, sliceIndex);
  const hasZikah = yevamim.some((y) => y.id === yavamId);

  if (hasZikah) {
    const errorMsg = message
      ? `${message}: Unexpected zikah found`
      : `Did not expect zikah between yavam ${yavamId} and yevama ${yevamaId} at slice ${sliceIndex}, but it exists`;
    expect.fail(errorMsg);
  }
}

/**
 * Assert that a person is a yevama (has active zikah).
 */
export function expectIsYevama(
  engine: StatusEngine,
  personId: string,
  sliceIndex: number,
  message?: string
): void {
  const yevamos = engine.getYevamos(sliceIndex);
  const isYevama = yevamos.some((y) => y.id === personId);

  if (!isYevama) {
    const errorMsg = message
      ? `${message}: Person is not a yevama`
      : `Expected ${personId} to be a yevama at slice ${sliceIndex}, but they are not`;
    expect.fail(errorMsg);
  }
}

/**
 * Assert that a person is NOT a yevama.
 */
export function expectNotYevama(
  engine: StatusEngine,
  personId: string,
  sliceIndex: number,
  message?: string
): void {
  const yevamos = engine.getYevamos(sliceIndex);
  const isYevama = yevamos.some((y) => y.id === personId);

  if (isYevama) {
    const errorMsg = message
      ? `${message}: Person is unexpectedly a yevama`
      : `Did not expect ${personId} to be a yevama at slice ${sliceIndex}, but they are`;
    expect.fail(errorMsg);
  }
}

/**
 * Get all status categories for debugging.
 */
export function getStatusCategories(status: ComputedStatus): string[] {
  return status.allStatuses.map((s) => s.category.id);
}

/**
 * Get all status names for debugging.
 */
export function getStatusNames(status: ComputedStatus): string[] {
  return status.allStatuses.map((s) => s.statusName.en);
}
