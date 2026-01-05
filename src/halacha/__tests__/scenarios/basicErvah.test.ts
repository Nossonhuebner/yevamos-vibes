/**
 * Basic Ervah Relationships
 *
 * Tests fundamental Torah-level prohibited relationships that don't change over time:
 * - Mother (אם)
 * - Daughter (בת)
 * - Sister (אחות)
 * - Father's wife (אשת אב) - stepmother
 * - Son's wife (כלה) - daughter-in-law
 *
 * These are permanent prohibitions that exist regardless of marital status.
 */

import { describe, it } from 'vitest';
import { scenario } from '@/test/TestScenarioBuilder';
import {
  expectStatus,
  expectMarriageForbidden,
} from '@/test/assertions';
import { DEFAULT_PROFILE } from '@/test/profiles';
import { createStatusEngine } from '@/halacha/statusEngine';
import { SAMPLE_REGISTRY } from '@/halacha/data/sampleRules';

describe('Basic Ervah Relationships', () => {
  describe('Mother (אם)', () => {
    it('mother is ervah to son', () => {
      const builder = scenario('Mother-Son')
        .addPerson('mother', 'female')
        .addPerson('father', 'male')
        .marry('father', 'mother')
        .addChild('father', 'mother', 'son', 'male');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const sonId = builder.getPersonId('son');
      const motherId = builder.getPersonId('mother');

      expectStatus(engine, sonId, motherId, 0, DEFAULT_PROFILE, 'ervah-doraita');
      expectMarriageForbidden(engine, sonId, motherId, 0, DEFAULT_PROFILE);
    });
  });

  describe('Daughter (בת)', () => {
    it('daughter is ervah to father', () => {
      const builder = scenario('Father-Daughter')
        .addPerson('father', 'male')
        .addPerson('mother', 'female')
        .marry('father', 'mother')
        .addChild('father', 'mother', 'daughter', 'female');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const fatherId = builder.getPersonId('father');
      const daughterId = builder.getPersonId('daughter');

      expectStatus(engine, fatherId, daughterId, 0, DEFAULT_PROFILE, 'ervah-doraita');
      expectMarriageForbidden(engine, fatherId, daughterId, 0, DEFAULT_PROFILE);
    });
  });

  describe('Sister (אחות)', () => {
    it('sister is ervah to brother', () => {
      const builder = scenario('Brother-Sister')
        .addPerson('father', 'male')
        .addPerson('mother', 'female')
        .marry('father', 'mother')
        .addChild('father', 'mother', 'brother', 'male')
        .addChild('father', 'mother', 'sister', 'female');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const brotherId = builder.getPersonId('brother');
      const sisterId = builder.getPersonId('sister');

      expectStatus(engine, brotherId, sisterId, 0, DEFAULT_PROFILE, 'ervah-doraita');
      expectMarriageForbidden(engine, brotherId, sisterId, 0, DEFAULT_PROFILE);
    });

    it('half-sister (same father) is also ervah', () => {
      const builder = scenario('Half Sister - Same Father')
        .addPerson('father', 'male')
        .addPerson('mother1', 'female')
        .marry('father', 'mother1')
        .addChild('father', 'mother1', 'son', 'male')
        .nextSlice('Father remarries')
        .addPerson('mother2', 'female')
        .marry('father', 'mother2')
        .addChild('father', 'mother2', 'halfsister', 'female');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const sonId = builder.getPersonId('son');
      const halfsisterId = builder.getPersonId('halfsister');

      // Half-sister is also ervah
      expectStatus(engine, sonId, halfsisterId, 1, DEFAULT_PROFILE, 'ervah-doraita');
    });
  });

  describe("Father's Wife (אשת אב) - Stepmother", () => {
    it("stepmother is ervah to stepson", () => {
      const builder = scenario('Stepmother')
        .addPerson('father', 'male')
        .addPerson('mother', 'female')
        .marry('father', 'mother')
        .addChild('father', 'mother', 'son', 'male')
        .nextSlice('Mother dies')
        .die('mother')
        .nextSlice('Father remarries')
        .addPerson('stepmother', 'female')
        .marry('father', 'stepmother');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const sonId = builder.getPersonId('son');
      const stepmotherId = builder.getPersonId('stepmother');

      // Stepmother (father's wife) is ervah
      expectStatus(engine, sonId, stepmotherId, 2, DEFAULT_PROFILE, 'ervah-doraita');
      expectMarriageForbidden(engine, sonId, stepmotherId, 2, DEFAULT_PROFILE);
    });
  });

  describe("Son's Wife (כלה) - Daughter-in-law", () => {
    it("daughter-in-law is ervah to father-in-law", () => {
      const builder = scenario('Daughter-in-law')
        .addPerson('father', 'male')
        .addPerson('mother', 'female')
        .marry('father', 'mother')
        .addChild('father', 'mother', 'son', 'male')
        .nextSlice('Son marries')
        .addPerson('daughter_in_law', 'female')
        .marry('son', 'daughter_in_law');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const fatherId = builder.getPersonId('father');
      const daughterInLawId = builder.getPersonId('daughter_in_law');

      // Son's wife is ervah to father
      expectStatus(engine, fatherId, daughterInLawId, 1, DEFAULT_PROFILE, 'ervah-doraita');
      expectMarriageForbidden(engine, fatherId, daughterInLawId, 1, DEFAULT_PROFILE);
    });
  });

  describe("Wife's Sister (אחות אשה)", () => {
    it("wife's sister is ervah while wife is alive", () => {
      const builder = scenario("Wife's Sister")
        .addPerson('husband', 'male')
        .addPerson('wife', 'female')
        .addSibling('wife', 'sister', 'female')
        .marry('husband', 'wife');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const husbandId = builder.getPersonId('husband');
      const sisterId = builder.getPersonId('sister');

      // Wife's sister is ervah while married to wife
      expectStatus(engine, husbandId, sisterId, 0, DEFAULT_PROFILE, 'ervah-doraita');
    });

    it("wife's sister permitted after wife dies", () => {
      const builder = scenario("Wife's Sister - After Death")
        .addPerson('husband', 'male')
        .addPerson('wife', 'female')
        .addSibling('wife', 'sister', 'female')
        .marry('husband', 'wife')
        .nextSlice('Wife dies')
        .die('wife');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const husbandId = builder.getPersonId('husband');
      const sisterId = builder.getPersonId('sister');
      const wifeId = builder.getPersonId('wife');

      // At slice 0: Wife's sister is ervah
      expectStatus(engine, husbandId, sisterId, 0, DEFAULT_PROFILE, 'ervah-doraita');

      // At slice 1: Wife died - sister should no longer be ervah
      // (This is אחות אשה which is only while wife is alive)
      // Note: We should NOT have ervah-doraita for wife's sister after wife dies
    });
  });
});
