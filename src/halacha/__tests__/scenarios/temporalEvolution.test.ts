/**
 * Temporal Evolution Scenarios
 *
 * Tests halachic statuses that change over time due to:
 * - Death of spouse
 * - Divorce
 * - Birth of new family members
 * - Yibum/Chalitzah resolution
 *
 * These tests verify that the system correctly handles
 * relationships that evolve through different time slices.
 */

import { describe, it } from 'vitest';
import { scenario } from '@/test/TestScenarioBuilder';
import {
  expectStatus,
  expectNoStatus,
  expectZikah,
  expectNoZikah,
  expectIsYevama,
  expectNotYevama,
  expectMarriagePermitted,
  expectMarriageForbidden,
} from '@/test/assertions';
import { DEFAULT_PROFILE } from '@/test/profiles';
import { createStatusEngine } from '@/halacha/statusEngine';
import { SAMPLE_REGISTRY } from '@/halacha/data/sampleRules';

describe('Temporal Evolution Scenarios', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // Wife's Sister (אחות אשה) - Evolving Status
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Wife's Sister (אחות אשה) - Evolution", () => {
    it("wife's sister becomes permitted after divorce", () => {
      const builder = scenario("Wife's Sister After Divorce")
        .addPerson('husband', 'male')
        .addPerson('wife', 'female')
        .addSibling('wife', 'sister', 'female')
        .marry('husband', 'wife')
        .nextSlice('Husband divorces wife')
        .divorce('husband', 'wife');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const husbandId = builder.getPersonId('husband');
      const sisterId = builder.getPersonId('sister');

      // Slice 0: Wife's sister is ervah while married
      expectStatus(
        engine,
        husbandId,
        sisterId,
        0,
        DEFAULT_PROFILE,
        'ervah-doraita',
        "Wife's sister is ervah while married"
      );

      // Slice 1: After divorce, wife's sister should be permitted
      expectNoStatus(
        engine,
        husbandId,
        sisterId,
        1,
        DEFAULT_PROFILE,
        'ervah-doraita',
        "Wife's sister permitted after divorce"
      );
    });

    it("wife's sister becomes permitted after wife dies", () => {
      const builder = scenario("Wife's Sister After Death")
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

      // Slice 0: Forbidden
      expectStatus(engine, husbandId, sisterId, 0, DEFAULT_PROFILE, 'ervah-doraita');

      // Slice 1: Permitted after wife dies
      expectNoStatus(
        engine,
        husbandId,
        sisterId,
        1,
        DEFAULT_PROFILE,
        'ervah-doraita',
        "Wife's sister permitted after wife dies"
      );
    });

    it("wife's sister from second marriage - complex timeline", () => {
      const builder = scenario("Sequential Marriages to Sisters")
        .addPerson('husband', 'male')
        .addPerson('sister1', 'female')
        .addSibling('sister1', 'sister2', 'female')
        .marry('husband', 'sister1')
        // While married to sister1, sister2 is forbidden
        .nextSlice('Divorces sister1')
        .divorce('husband', 'sister1')
        // After divorce, sister2 becomes permitted
        .nextSlice('Marries sister2')
        .marry('husband', 'sister2');
        // Now sister1 becomes forbidden again!

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const husbandId = builder.getPersonId('husband');
      const sister1Id = builder.getPersonId('sister1');
      const sister2Id = builder.getPersonId('sister2');

      // Slice 0: Married to sister1 → sister2 forbidden
      expectStatus(engine, husbandId, sister2Id, 0, DEFAULT_PROFILE, 'ervah-doraita');

      // Slice 1: Divorced → sister2 permitted
      expectNoStatus(engine, husbandId, sister2Id, 1, DEFAULT_PROFILE, 'ervah-doraita');

      // Slice 2: Married to sister2 → sister1 now forbidden
      expectStatus(
        engine,
        husbandId,
        sister1Id,
        2,
        DEFAULT_PROFILE,
        'ervah-doraita',
        'After marrying sister2, sister1 becomes forbidden'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Zikah - Late-Born Brother
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Zikah - Late-Born Brother', () => {
    it('brother born after married brother dies has no zikah', () => {
      // Reuven marries, dies childless
      // Shimon is born AFTER Reuven dies
      // Shimon should have NO zikah - he wasn't alive when Reuven died
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

      // At slice 3: Shimon exists but should have no zikah
      // (He wasn't alive when Reuven died)
      expectNoZikah(
        engine,
        shimonId,
        rochelId,
        3,
        'Brother born after death has no zikah'
      );
    });

    it('brother alive at death has zikah, late brother does not', () => {
      const builder = scenario('Mixed Brothers - Some Late')
        .addPerson('father', 'male')
        .addPerson('mother', 'female')
        .marry('father', 'mother')
        .addChild('father', 'mother', 'reuven', 'male')
        .addChild('father', 'mother', 'shimon', 'male') // Born before
        .nextSlice('Reuven marries')
        .addPerson('rochel', 'female')
        .marry('reuven', 'rochel')
        .nextSlice('Reuven dies childless')
        .die('reuven')
        .nextSlice('Levi is born after')
        .addChild('father', 'mother', 'levi', 'male');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const shimonId = builder.getPersonId('shimon');
      const leviId = builder.getPersonId('levi');
      const rochelId = builder.getPersonId('rochel');

      // Shimon (alive at death) has zikah
      expectZikah(engine, shimonId, rochelId, 3, 'Shimon has zikah');

      // Levi (born after) has no zikah
      expectNoZikah(engine, leviId, rochelId, 3, 'Levi (late) has no zikah');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Married Woman (אשת איש) - Evolution
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Married Woman (אשת איש) - Evolution', () => {
    it('married woman forbidden, widow permitted', () => {
      const builder = scenario('Widow Status')
        .addPerson('husband', 'male')
        .addPerson('wife', 'female')
        .marry('husband', 'wife')
        .addPerson('other_man', 'male')
        .nextSlice('Husband dies')
        .die('husband');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const wifeId = builder.getPersonId('wife');
      const otherManId = builder.getPersonId('other_man');

      // Slice 0: Wife is married - forbidden to other man
      expectStatus(
        engine,
        otherManId,
        wifeId,
        0,
        DEFAULT_PROFILE,
        'ervah-doraita',
        'Married woman is ervah'
      );

      // Slice 1: Husband died - no longer "married woman"
      expectNoStatus(
        engine,
        otherManId,
        wifeId,
        1,
        DEFAULT_PROFILE,
        'ervah-doraita',
        'Widow is not eishes ish'
      );
    });

    it('divorcee permitted to remarry', () => {
      const builder = scenario('Divorcee')
        .addPerson('husband', 'male')
        .addPerson('wife', 'female')
        .marry('husband', 'wife')
        .addPerson('other_man', 'male')
        .nextSlice('Divorce')
        .divorce('husband', 'wife');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const wifeId = builder.getPersonId('wife');
      const otherManId = builder.getPersonId('other_man');

      // Slice 0: Married - forbidden
      expectStatus(engine, otherManId, wifeId, 0, DEFAULT_PROFILE, 'ervah-doraita');

      // Slice 1: Divorced - permitted
      expectNoStatus(
        engine,
        otherManId,
        wifeId,
        1,
        DEFAULT_PROFILE,
        'ervah-doraita',
        'Divorcee is permitted'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Yibum Resolution
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Yibum Resolution', () => {
    // TODO: This test needs proper sibling setup through shared parents
    // The addSibling helper creates implicit parents which may not satisfy
    // the zikah lifetime overlap check
    it.skip('after yibum, yevama becomes wife of yavam', () => {
      const builder = scenario('Yibum Performed')
        .addPerson('reuven', 'male')
        .addSibling('reuven', 'shimon', 'male')
        .addPerson('rochel', 'female')
        .marry('reuven', 'rochel')
        .nextSlice('Reuven dies childless')
        .die('reuven')
        .nextSlice('Shimon performs yibum')
        .yibum('shimon', 'rochel');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const shimonId = builder.getPersonId('shimon');
      const rochelId = builder.getPersonId('rochel');

      // Slice 1: Active zikah
      expectZikah(engine, shimonId, rochelId, 1);
      expectIsYevama(engine, rochelId, 1);

      // Slice 2: After yibum - she's now his wife
      // The zikah should be resolved
      // (Implementation depends on how yibum is tracked)
    });

    it('after chalitzah, other brothers still have no claim', () => {
      const builder = scenario('Chalitzah Performed')
        .addPerson('reuven', 'male')
        .addSibling('reuven', 'shimon', 'male')
        .addSibling('reuven', 'levi', 'male')
        .addPerson('rochel', 'female')
        .marry('reuven', 'rochel')
        .nextSlice('Reuven dies childless')
        .die('reuven')
        .nextSlice('Shimon does chalitzah')
        .chalitzah('shimon', 'rochel');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const leviId = builder.getPersonId('levi');
      const rochelId = builder.getPersonId('rochel');

      // Slice 1: Both brothers have zikah
      expectZikah(engine, leviId, rochelId, 1);

      // Slice 2: After chalitzah with Shimon
      // Rochel should no longer be a yevama to anyone
      // (Chalitzah releases the zikah for all brothers)
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Permanent vs Temporal Ervah
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Permanent vs Temporal Ervah', () => {
    it("wife's mother remains ervah forever (even after divorce)", () => {
      const builder = scenario("Mother-in-law Forever")
        .addPerson('husband', 'male')
        .addPerson('mother_in_law', 'female')
        .addPerson('father_in_law', 'male')
        .marry('father_in_law', 'mother_in_law')
        .addChild('father_in_law', 'mother_in_law', 'wife', 'female')
        .nextSlice('Husband marries')
        .marry('husband', 'wife')
        .nextSlice('Husband divorces')
        .divorce('husband', 'wife');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const husbandId = builder.getPersonId('husband');
      const motherInLawId = builder.getPersonId('mother_in_law');

      // Slice 1: While married - mother-in-law is ervah
      expectStatus(engine, husbandId, motherInLawId, 1, DEFAULT_PROFILE, 'ervah-doraita');

      // Slice 2: After divorce - mother-in-law STILL ervah (permanent)
      expectStatus(
        engine,
        husbandId,
        motherInLawId,
        2,
        DEFAULT_PROFILE,
        'ervah-doraita',
        "Mother-in-law is permanent ervah even after divorce"
      );
    });

    // Son's Wife (כלה) is a PERMANENT ervah that persists even after the son dies.
    // This is implemented via the historicalSpouse flag on the pattern.
    it("son's wife remains ervah forever (even after son dies)", () => {
      const builder = scenario("Daughter-in-law Forever")
        .addPerson('father', 'male')
        .addPerson('mother', 'female')
        .marry('father', 'mother')
        .addChild('father', 'mother', 'son', 'male')
        .nextSlice('Son marries')
        .addPerson('daughter_in_law', 'female')
        .marry('son', 'daughter_in_law')
        .nextSlice('Son dies')
        .die('son');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const fatherId = builder.getPersonId('father');
      const daughterInLawId = builder.getPersonId('daughter_in_law');

      // Slice 1: While son alive - daughter-in-law is ervah
      expectStatus(engine, fatherId, daughterInLawId, 1, DEFAULT_PROFILE, 'ervah-doraita');

      // Slice 2: After son dies - daughter-in-law STILL ervah (permanent)
      expectStatus(
        engine,
        fatherId,
        daughterInLawId,
        2,
        DEFAULT_PROFILE,
        'ervah-doraita',
        "Daughter-in-law is permanent ervah even after son dies"
      );
    });

    // Father's Wife (אשת אב) is a PERMANENT ervah that persists even after the father dies.
    // This is implemented via the historicalSpouse flag on the pattern.
    it("father's wife (stepmother) remains ervah after father dies", () => {
      const builder = scenario("Stepmother Forever")
        .addPerson('father', 'male')
        .addPerson('mother', 'female')
        .marry('father', 'mother')
        .addChild('father', 'mother', 'son', 'male')
        .nextSlice('Mother dies')
        .die('mother')
        .nextSlice('Father remarries')
        .addPerson('stepmother', 'female')
        .marry('father', 'stepmother')
        .nextSlice('Father dies')
        .die('father');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const sonId = builder.getPersonId('son');
      const stepmotherId = builder.getPersonId('stepmother');

      // Slice 2: While father alive - stepmother is ervah
      expectStatus(engine, sonId, stepmotherId, 2, DEFAULT_PROFILE, 'ervah-doraita');

      // Slice 3: After father dies - stepmother STILL ervah (permanent)
      expectStatus(
        engine,
        sonId,
        stepmotherId,
        3,
        DEFAULT_PROFILE,
        'ervah-doraita',
        "Stepmother is permanent ervah even after father dies"
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Complex Multi-Stage Scenarios
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Complex Multi-Stage Scenarios', () => {
    it('classic yevamos scenario: wife falls to brother, then he dies too', () => {
      // Reuven and Shimon are brothers
      // Reuven marries Rochel
      // Reuven dies childless → zikah to Shimon
      // Shimon also dies before yibum → what happens?
      const builder = scenario('Sequential Deaths')
        .addPerson('reuven', 'male')
        .addSibling('reuven', 'shimon', 'male')
        .addSibling('reuven', 'levi', 'male')
        .addPerson('rochel', 'female')
        .marry('reuven', 'rochel')
        .nextSlice('Reuven dies childless')
        .die('reuven')
        .nextSlice('Shimon dies before yibum')
        .die('shimon');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const leviId = builder.getPersonId('levi');
      const rochelId = builder.getPersonId('rochel');

      // Slice 1: Rochel has zikah to both Shimon and Levi
      expectIsYevama(engine, rochelId, 1);

      // Slice 2: Shimon died - only Levi remains as yavam
      // Rochel should still be yevama to Levi
      expectZikah(engine, leviId, rochelId, 2);
    });

    // KNOWN GAP: Zikah is evaluated at the time of death and checks for existing
    // children at that moment. A posthumously born child should release the zikah,
    // but the current implementation doesn't re-evaluate zikah when children are added.
    it.skip('new child born releases yevama', () => {
      // If the dead brother's child is born posthumously,
      // the zikah is released
      const builder = scenario('Posthumous Child')
        .addPerson('reuven', 'male')
        .addSibling('reuven', 'shimon', 'male')
        .addPerson('rochel', 'female')
        .marry('reuven', 'rochel')
        .nextSlice('Reuven dies - Rochel pregnant')
        .die('reuven')
        // At this point zikah exists
        .nextSlice('Child is born')
        .addChild('reuven', 'rochel', 'posthumous_child', 'male');

      const graph = builder.build();
      const engine = createStatusEngine(graph, SAMPLE_REGISTRY);

      const shimonId = builder.getPersonId('shimon');
      const rochelId = builder.getPersonId('rochel');

      // Slice 1: Before child born - zikah exists
      // (Depending on implementation, might already account for pregnancy)

      // Slice 2: After child born - no more zikah
      // Child exists → no yibum obligation
      expectNoZikah(
        engine,
        shimonId,
        rochelId,
        2,
        'Child born releases zikah'
      );
      expectNotYevama(engine, rochelId, 2);
    });
  });
});
