/**
 * Brother's Wife (אשת אח) Scenarios
 *
 * Tests the halachic status of a brother's wife through various stages:
 * - While brother is alive: She is an ervah (Torah-level prohibition)
 * - After brother dies childless: Ervah persists, but zikah allows yibum
 * - After brother dies with children: Ervah persists, marriage forbidden
 *
 * Key insight: Brother's Wife (אשת אח) is a PERMANENT ervah that persists
 * even after the brother dies. However, when yibum applies (active zikah),
 * the ervah is overridden for that purpose.
 *
 * Rules covered:
 * - ervah-brothers-wife: Brother's wife is forbidden (permanent ervah)
 * - Zikah creation when married man dies childless
 * - Zikah allows marriage despite the ervah status
 */

import { describe, it } from 'vitest';
import { scenario } from '@/test/TestScenarioBuilder';
import {
  expectStatus,
  expectZikah,
  expectNoZikah,
  expectIsYevama,
  expectNotYevama,
  expectMarriageForbidden,
  expectMarriagePermitted,
} from '@/test/assertions';
import { DEFAULT_PROFILE } from '@/test/profiles';
import { createStatusEngine } from '@/halacha/statusEngine';
import { SAMPLE_REGISTRY } from '@/halacha/data/sampleRules';

describe("Brother's Wife (אשת אח)", () => {
  describe('while brother is alive', () => {
    it("brother's wife is ervah to the other brother", () => {
      // Setup: Two brothers, one married
      const builder = scenario("Brother's Wife - Basic")
        .addPerson('reuven', 'male')
        .addSibling('reuven', 'shimon', 'male')
        .addPerson('rochel', 'female')
        .marry('reuven', 'rochel');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const shimonId = builder.getPersonId('shimon');
      const rochelId = builder.getPersonId('rochel');

      // Shimon → Rochel: Brother's wife is forbidden (ervah doraita)
      expectStatus(
        engine,
        shimonId,
        rochelId,
        0,
        DEFAULT_PROFILE,
        'ervah-doraita',
        "Brother's wife should be ervah"
      );

      // Marriage should be forbidden
      expectMarriageForbidden(
        engine,
        shimonId,
        rochelId,
        0,
        DEFAULT_PROFILE,
        "Cannot marry brother's wife"
      );
    });

    it('works with multiple brothers', () => {
      // Setup: Three brothers, one married
      const builder = scenario('Multiple Brothers')
        .addPerson('reuven', 'male')
        .addSibling('reuven', 'shimon', 'male')
        .addSibling('reuven', 'levi', 'male')
        .addPerson('rochel', 'female')
        .marry('reuven', 'rochel');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const shimonId = builder.getPersonId('shimon');
      const leviId = builder.getPersonId('levi');
      const rochelId = builder.getPersonId('rochel');

      // Both brothers should see Rochel as ervah
      expectStatus(engine, shimonId, rochelId, 0, DEFAULT_PROFILE, 'ervah-doraita');
      expectStatus(engine, leviId, rochelId, 0, DEFAULT_PROFILE, 'ervah-doraita');
    });
  });

  describe('after brother dies childless', () => {
    it("brother's wife status persists but yibum is permitted", () => {
      // Setup: Two brothers, one married, then the married one dies childless
      const builder = scenario('Yibum Scenario')
        .addPerson('reuven', 'male')
        .addSibling('reuven', 'shimon', 'male')
        .addPerson('rochel', 'female')
        .marry('reuven', 'rochel')
        .nextSlice('Reuven dies childless')
        .die('reuven');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const shimonId = builder.getPersonId('shimon');
      const rochelId = builder.getPersonId('rochel');

      // At slice 0 (before death): Brother's wife is ervah, marriage forbidden
      expectStatus(
        engine,
        shimonId,
        rochelId,
        0,
        DEFAULT_PROFILE,
        'ervah-doraita',
        "Before death: Brother's wife should be ervah"
      );
      expectMarriageForbidden(
        engine,
        shimonId,
        rochelId,
        0,
        DEFAULT_PROFILE,
        "Before death: Cannot marry brother's wife"
      );

      // At slice 1 (after death): Brother's wife status PERSISTS (it's a permanent ervah)
      // but yibum is permitted due to active zikah
      expectStatus(
        engine,
        shimonId,
        rochelId,
        1,
        DEFAULT_PROFILE,
        'ervah-doraita',
        "After death: Brother's wife status persists (permanent ervah)"
      );

      // Rochel should now be a yevama
      expectIsYevama(
        engine,
        rochelId,
        1,
        'After husband dies childless: wife should be yevama'
      );

      // Zikah should exist between Shimon and Rochel
      expectZikah(
        engine,
        shimonId,
        rochelId,
        1,
        'Zikah should exist after brother dies childless'
      );

      // Marriage IS permitted because zikah overrides the ervah for yibum
      expectMarriagePermitted(
        engine,
        shimonId,
        rochelId,
        1,
        DEFAULT_PROFILE,
        'Yibum is permitted despite ervah status'
      );
    });

    it('multiple brothers all have zikah and can do yibum', () => {
      const builder = scenario('Multiple Brothers Yibum')
        .addPerson('reuven', 'male')
        .addSibling('reuven', 'shimon', 'male')
        .addSibling('reuven', 'levi', 'male')
        .addPerson('rochel', 'female')
        .marry('reuven', 'rochel')
        .nextSlice('Reuven dies childless')
        .die('reuven');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const shimonId = builder.getPersonId('shimon');
      const leviId = builder.getPersonId('levi');
      const rochelId = builder.getPersonId('rochel');

      // Both brothers should have zikah
      expectZikah(engine, shimonId, rochelId, 1);
      expectZikah(engine, leviId, rochelId, 1);

      // Both still have the ervah status (it's permanent)
      expectStatus(engine, shimonId, rochelId, 1, DEFAULT_PROFILE, 'ervah-doraita');
      expectStatus(engine, leviId, rochelId, 1, DEFAULT_PROFILE, 'ervah-doraita');

      // But both can do yibum (marriage permitted due to zikah)
      expectMarriagePermitted(engine, shimonId, rochelId, 1, DEFAULT_PROFILE);
      expectMarriagePermitted(engine, leviId, rochelId, 1, DEFAULT_PROFILE);
    });
  });

  describe('after brother dies WITH children', () => {
    it('no zikah and marriage remains forbidden (ervah persists)', () => {
      const builder = scenario('Brother with Children')
        .addPerson('reuven', 'male')
        .addSibling('reuven', 'shimon', 'male')
        .addPerson('rochel', 'female')
        .marry('reuven', 'rochel')
        .addChild('reuven', 'rochel', 'child', 'male')
        .nextSlice('Reuven dies')
        .die('reuven');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const shimonId = builder.getPersonId('shimon');
      const rochelId = builder.getPersonId('rochel');

      // No zikah - brother had children
      expectNoZikah(
        engine,
        shimonId,
        rochelId,
        1,
        'No zikah when brother had children'
      );

      // Rochel should not be a yevama
      expectNotYevama(
        engine,
        rochelId,
        1,
        'Widow with children is not a yevama'
      );

      // Brother's Wife ervah PERSISTS (it's a permanent ervah)
      expectStatus(
        engine,
        shimonId,
        rochelId,
        1,
        DEFAULT_PROFILE,
        'ervah-doraita',
        "Brother's wife ervah persists even after death"
      );

      // Marriage remains FORBIDDEN (no yibum without zikah)
      expectMarriageForbidden(
        engine,
        shimonId,
        rochelId,
        1,
        DEFAULT_PROFILE,
        "Cannot marry brother's wife when no yibum applies"
      );
    });
  });

  describe('edge cases', () => {
    it('brother who dies before the marriage is not counted', () => {
      // Shimon dies before Reuven marries - no zikah to Shimon
      const builder = scenario('Brother Dies Before Marriage')
        .addPerson('reuven', 'male')
        .addSibling('reuven', 'shimon', 'male')
        .die('shimon') // Shimon dies first
        .nextSlice('Reuven marries Rochel')
        .addPerson('rochel', 'female')
        .marry('reuven', 'rochel')
        .nextSlice('Reuven dies childless')
        .die('reuven');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const shimonId = builder.getPersonId('shimon');
      const rochelId = builder.getPersonId('rochel');

      // No zikah to dead brother - he died before the marriage
      expectNoZikah(
        engine,
        shimonId,
        rochelId,
        2,
        'Dead brother cannot be a yavam'
      );
    });

    it("brother's wife through half-brother is still ervah", () => {
      // Half-brothers share only one parent
      const builder = scenario('Half Brothers')
        .addPerson('father', 'male')
        .addPerson('mother1', 'female')
        .marry('father', 'mother1')
        .addChild('father', 'mother1', 'reuven', 'male')
        .nextSlice('Father remarries')
        .addPerson('mother2', 'female')
        .marry('father', 'mother2')
        .addChild('father', 'mother2', 'shimon', 'male')
        .nextSlice('Reuven marries')
        .addPerson('rochel', 'female')
        .marry('reuven', 'rochel');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const shimonId = builder.getPersonId('shimon');
      const rochelId = builder.getPersonId('rochel');

      // Half-brother's wife should still be ervah
      expectStatus(
        engine,
        shimonId,
        rochelId,
        2,
        DEFAULT_PROFILE,
        'ervah-doraita',
        "Half-brother's wife is also ervah"
      );
    });

    it('brother born AFTER brother dies - no zikah but still ervah', () => {
      // Reuven marries Rochel, dies childless
      // Shimon is born AFTER Reuven dies
      // Shimon has NO zikah (wasn't alive during the marriage)
      // BUT Rochel is still אשת אח to Shimon (forbidden)
      const builder = scenario('Late-Born Brother')
        .addPerson('father', 'male')
        .addPerson('mother', 'female')
        .marry('father', 'mother')
        .addChild('father', 'mother', 'reuven', 'male')
        .nextSlice('Reuven marries')
        .addPerson('rochel', 'female')
        .marry('reuven', 'rochel')
        .nextSlice('Reuven dies childless')
        .die('reuven')
        .nextSlice('Shimon is born after Reuven dies')
        .addChild('father', 'mother', 'shimon', 'male');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const shimonId = builder.getPersonId('shimon');
      const rochelId = builder.getPersonId('rochel');

      // No zikah - Shimon wasn't alive when Reuven died
      expectNoZikah(
        engine,
        shimonId,
        rochelId,
        3,
        'Brother born after death has no zikah'
      );

      // Rochel is NOT a yevama (no living brothers at time of death had zikah)
      // Note: This depends on whether there were OTHER brothers alive
      // In this case, there were none, so she has no yevamim

      // But Rochel IS still אשת אח to Shimon (it's a permanent ervah)
      expectStatus(
        engine,
        shimonId,
        rochelId,
        3,
        DEFAULT_PROFILE,
        'ervah-doraita',
        "Brother's wife is ervah even to late-born brother"
      );

      // Marriage is FORBIDDEN (no yibum, so ervah stands)
      expectMarriageForbidden(
        engine,
        shimonId,
        rochelId,
        3,
        DEFAULT_PROFILE,
        'Cannot marry - no yibum for late-born brother'
      );
    });
  });
});
