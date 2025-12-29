/**
 * Sample Ervah Rules
 *
 * Example halachic rules for testing the status engine.
 * These demonstrate how to define rules with different patterns.
 */

import { HalachicRule, HalachicRegistry, Machlokas } from '../types';
import { DEFAULT_CATEGORIES } from '../categories';

// ═══════════════════════════════════════════════════════════════════════════
// Sample Ervah Rules (Torah-level prohibitions)
// ═══════════════════════════════════════════════════════════════════════════

export const SAMPLE_RULES: HalachicRule[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Direct Relationship Rules
  // ─────────────────────────────────────────────────────────────────────────

  // Mother (אמו)
  {
    id: 'ervah-mother',
    name: { en: 'Mother', he: 'אמו' },
    description: {
      en: "One's mother is forbidden",
      he: 'אמו אסורה עליו',
    },
    pattern: {
      type: 'path',
      pathPattern: 'parent',
      throughGender: 'female',
    },
    produces: {
      categoryId: 'ervah-doraita',
      statusName: { en: 'Mother', he: 'אמו' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
    sources: ['Vayikra 18:7'],
  },

  // Daughter (בתו)
  {
    id: 'ervah-daughter',
    name: { en: 'Daughter', he: 'בתו' },
    description: {
      en: "One's daughter is forbidden",
      he: 'בתו אסורה עליו',
    },
    pattern: {
      type: 'path',
      pathPattern: 'child',
      throughGender: 'female',
    },
    produces: {
      categoryId: 'ervah-doraita',
      statusName: { en: 'Daughter', he: 'בתו' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
    sources: ['Vayikra 18:10'],
  },

  // Sister (אחותו)
  {
    id: 'ervah-sister',
    name: { en: 'Sister', he: 'אחותו' },
    description: {
      en: "One's sister is forbidden",
      he: 'אחותו אסורה עליו',
    },
    pattern: {
      type: 'path',
      pathPattern: 'sibling',
      throughGender: 'female',
    },
    produces: {
      categoryId: 'ervah-doraita',
      statusName: { en: 'Sister', he: 'אחותו' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
    sources: ['Vayikra 18:9'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Path-Based Rules (Derived Relationships)
  // ─────────────────────────────────────────────────────────────────────────

  // Wife (current spouse) - This is for showing marriage, not an issur
  {
    id: 'wife-current',
    name: { en: 'Wife', he: 'אשתו' },
    description: {
      en: 'Current wife',
      he: 'אשתו',
    },
    pattern: {
      type: 'direct',
      directEdgeTypes: ['nisuin', 'erusin'],
    },
    produces: {
      categoryId: 'mutar',
      statusName: { en: 'Wife', he: 'אשתו' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
  },

  // Married Woman (אשת איש) - Forbidden to all other men
  {
    id: 'ervah-aishes-ish',
    name: { en: 'Married Woman', he: 'אשת איש' },
    description: {
      en: 'A married woman is forbidden to all other men',
      he: 'אשת איש אסורה לכל אדם אחר',
    },
    pattern: {
      type: 'composite',
      compositeOp: 'and',
      subPatterns: [
        // B is currently married
        {
          type: 'state',
          stateConditions: [{ person: 'B', condition: 'married' }],
        },
        // A is NOT B's spouse
        {
          type: 'direct',
          directEdgeTypes: ['nisuin', 'erusin'],
          negate: true,
        },
      ],
    },
    produces: {
      categoryId: 'ervah-doraita',
      statusName: { en: 'Married Woman', he: 'אשת איש' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
    sources: ['Vayikra 18:20'],
  },

  // Brother's Wife (אשת אח) - Forbidden except for yibum
  {
    id: 'ervah-brothers-wife',
    name: { en: "Brother's Wife", he: 'אשת אח' },
    description: {
      en: "Brother's wife is forbidden (except for yibum)",
      he: 'אשת אח אסורה עליו חוץ מיבום',
    },
    pattern: {
      type: 'path',
      pathPattern: 'sibling.spouse',
      throughGender: 'male', // Through male sibling (brother)
    },
    produces: {
      categoryId: 'ervah-doraita',
      statusName: { en: "Brother's Wife", he: 'אשת אח' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
    sources: ['Vayikra 18:16'],
  },

  // Wife's Sister (אחות אשה) - Forbidden while wife is alive
  {
    id: 'ervah-wifes-sister',
    name: { en: "Wife's Sister", he: 'אחות אשה' },
    description: {
      en: "Wife's sister is forbidden while wife is alive",
      he: 'אחות אשה אסורה בחיי אשתו',
    },
    pattern: {
      type: 'path',
      pathPattern: 'spouse.sibling',
      throughGender: 'female', // Sibling must be female (sister)
    },
    produces: {
      categoryId: 'ervah-doraita',
      statusName: { en: "Wife's Sister", he: 'אחות אשה' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
    sources: ['Vayikra 18:18'],
  },

  // Mother-in-law (חמותו)
  {
    id: 'ervah-mother-in-law',
    name: { en: 'Mother-in-law', he: 'חמותו' },
    description: {
      en: "Wife's mother is forbidden",
      he: 'אם אשתו אסורה עליו',
    },
    pattern: {
      type: 'path',
      pathPattern: 'spouse.parent',
      throughGender: 'female',
    },
    produces: {
      categoryId: 'ervah-doraita',
      statusName: { en: 'Mother-in-law', he: 'חמותו' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
    sources: ['Vayikra 18:17'],
  },

  // Father's Wife (אשת אב)
  {
    id: 'ervah-fathers-wife',
    name: { en: "Father's Wife", he: 'אשת אב' },
    description: {
      en: "Father's wife (stepmother) is forbidden",
      he: 'אשת אב אסורה עליו',
    },
    pattern: {
      type: 'path',
      pathPattern: 'parent.spouse',
      pathGenders: ['male', 'female'], // Father → his wife
    },
    produces: {
      categoryId: 'ervah-doraita',
      statusName: { en: "Father's Wife", he: 'אשת אב' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
    sources: ['Vayikra 18:8'],
  },

  // Father's Sister (דודתו מן האב)
  {
    id: 'ervah-fathers-sister',
    name: { en: "Father's Sister", he: 'דודתו מן האב' },
    description: {
      en: "Father's sister (paternal aunt) is forbidden",
      he: 'אחות אביו אסורה עליו',
    },
    pattern: {
      type: 'path',
      pathPattern: 'parent.sibling',
      pathGenders: ['male', 'female'], // Father → his sister
    },
    produces: {
      categoryId: 'ervah-doraita',
      statusName: { en: "Father's Sister", he: 'דודה מן האב' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
    sources: ['Vayikra 18:12'],
  },

  // Mother's Sister (אחות אם)
  {
    id: 'ervah-mothers-sister',
    name: { en: "Mother's Sister", he: 'אחות אם' },
    description: {
      en: "Mother's sister (maternal aunt) is forbidden",
      he: 'אחות אמו אסורה עליו',
    },
    pattern: {
      type: 'path',
      pathPattern: 'parent.sibling',
      pathGenders: ['female', 'female'], // Mother → her sister
    },
    produces: {
      categoryId: 'ervah-doraita',
      statusName: { en: "Mother's Sister", he: 'דודה מן האם' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
    sources: ['Vayikra 18:13'],
  },

  // Uncle's Wife / Father's Brother's Wife (אשת אחי האב)
  {
    id: 'ervah-uncles-wife',
    name: { en: "Uncle's Wife", he: 'אשת דודו' },
    description: {
      en: "Father's brother's wife (uncle's wife) is forbidden",
      he: 'אשת אחי אביו אסורה עליו',
    },
    pattern: {
      type: 'path',
      pathPattern: 'parent.sibling.spouse',
      pathGenders: ['male', 'male', 'female'], // Father → his brother → his wife
    },
    produces: {
      categoryId: 'ervah-doraita',
      statusName: { en: "Uncle's Wife", he: 'אשת דוד' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
    sources: ['Vayikra 18:14'],
  },

  // Daughter-in-law (כלתו)
  {
    id: 'ervah-daughter-in-law',
    name: { en: 'Daughter-in-law', he: 'כלתו' },
    description: {
      en: "Son's wife (daughter-in-law) is forbidden",
      he: 'אשת בנו אסורה עליו',
    },
    pattern: {
      type: 'path',
      pathPattern: 'child.spouse',
      pathGenders: ['male', 'female'], // Son → his wife
    },
    produces: {
      categoryId: 'ervah-doraita',
      statusName: { en: 'Daughter-in-law', he: 'כלה' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
    sources: ['Vayikra 18:15'],
  },

  // Stepdaughter / Wife's Daughter (בת אשתו)
  {
    id: 'ervah-stepdaughter',
    name: { en: 'Stepdaughter', he: 'בת אשתו' },
    description: {
      en: "Wife's daughter (stepdaughter) is forbidden",
      he: 'בת אשתו אסורה עליו',
    },
    pattern: {
      type: 'path',
      pathPattern: 'spouse.child',
      pathGenders: ['female', 'female'], // Wife → her daughter
    },
    produces: {
      categoryId: 'ervah-doraita',
      statusName: { en: 'Stepdaughter', he: 'בת אשה' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
    sources: ['Vayikra 18:17'],
  },

  // Wife's Granddaughter (בת בנה / בת בתה)
  {
    id: 'ervah-wifes-granddaughter',
    name: { en: "Wife's Granddaughter", he: 'בת בנה / בת בתה' },
    description: {
      en: "Wife's granddaughter is forbidden",
      he: 'בת בנה או בת בתה של אשתו אסורה עליו',
    },
    pattern: {
      type: 'path',
      pathPattern: 'spouse.child.child',
      pathGenders: ['female', null, 'female'], // Wife → any child → daughter
    },
    produces: {
      categoryId: 'ervah-doraita',
      statusName: { en: "Wife's Granddaughter", he: 'נכדת אשה' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
    sources: ['Vayikra 18:17'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Shniyot (Rabbinic Extensions)
  // ─────────────────────────────────────────────────────────────────────────

  // Grandmother (אם אמו / אם אביו)
  {
    id: 'shniyah-grandmother',
    name: { en: 'Grandmother', he: 'אם אם / אם אב' },
    description: {
      en: 'Grandmother is a shniyah (rabbinic)',
      he: 'אם אם או אם אב - שניות לעריות',
    },
    pattern: {
      type: 'path',
      pathPattern: 'parent.parent',
      throughGender: 'female',
    },
    produces: {
      categoryId: 'shniyah',
      statusName: { en: 'Grandmother', he: 'סבתא' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
  },

  // Great-grandmother
  {
    id: 'shniyah-great-grandmother',
    name: { en: 'Great-grandmother', he: 'אם אם אם' },
    description: {
      en: 'Great-grandmother is a shniyah (rabbinic)',
      he: 'אם אם אם - שניות לעריות',
    },
    pattern: {
      type: 'path',
      pathPattern: 'parent.parent.parent',
      throughGender: 'female',
    },
    produces: {
      categoryId: 'shniyah',
      statusName: { en: 'Great-grandmother', he: 'סבתא רבא' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
  },

  // Granddaughter (בת בת / בת בן)
  {
    id: 'shniyah-granddaughter',
    name: { en: 'Granddaughter', he: 'בת בן / בת בת' },
    description: {
      en: 'Granddaughter is a shniyah (rabbinic)',
      he: 'בת הבן או בת הבת - שניות לעריות',
    },
    pattern: {
      type: 'path',
      pathPattern: 'child.child',
      throughGender: 'female',
    },
    produces: {
      categoryId: 'shniyah',
      statusName: { en: 'Granddaughter', he: 'נכדה' },
    },
    dependsOnMachlokos: [],
    appliesWhen: [],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Sample Machlokos (for future use)
// ═══════════════════════════════════════════════════════════════════════════

export const SAMPLE_MACHLOKOS: Machlokas[] = [
  {
    id: 'yesh-zikah',
    title: { en: 'Is There Zikah?', he: 'יש זיקה או אין זיקה' },
    question: {
      en: 'Does the levirate bond create a quasi-marriage status?',
      he: 'האם הזיקה יוצרת מעין קידושין?',
    },
    opinions: [
      {
        id: 'yesh-zikah',
        holders: ['Rav'],
        position: {
          en: 'Yes, zikah creates a partial bond',
          he: 'יש זיקה',
        },
        sources: ['Yevamos 17b'],
      },
      {
        id: 'ein-zikah',
        holders: ['Shmuel'],
        position: {
          en: 'No, there is no quasi-marriage status',
          he: 'אין זיקה',
        },
        sources: ['Yevamos 17b'],
      },
    ],
    defaultOpinionId: 'yesh-zikah',
    level: 'amoraim',
    sources: ['Yevamos 17b-18a'],
    description: {
      en: 'Whether the yevama has a bond to the yavam before yibum',
      he: 'האם היבמה זקוקה ליבם קודם היבום',
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Registry Export
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a sample registry with the example rules.
 */
export function createSampleRegistry(): HalachicRegistry {
  return {
    categories: DEFAULT_CATEGORIES,
    rules: SAMPLE_RULES,
    machlokos: SAMPLE_MACHLOKOS,
    profiles: [],
  };
}

/**
 * Get the sample registry.
 */
export const SAMPLE_REGISTRY: HalachicRegistry = createSampleRegistry();
