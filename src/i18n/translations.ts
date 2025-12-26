export type Language = 'en' | 'he';

export const translations = {
  en: {
    // App-level
    untitledGraph: 'Untitled Graph',

    // Toolbar
    exportJson: 'Export JSON',
    importJson: 'Import JSON',
    reset: 'Reset',
    resetConfirm: 'Are you sure you want to reset the graph? This cannot be undone.',
    importFailed: 'Failed to import:',

    // View Mode
    focusMode: 'Focus Mode',
    overviewMode: 'Overview Mode',
    enterFocusMode: 'Enter Focus Mode (slideshow)',
    exitToOverview: 'Exit to Overview Mode',

    // Playback
    play: 'Play',
    pause: 'Pause',
    playbackSpeed: 'Playback speed',
    slow: 'Slow (3s)',
    medium: 'Medium (2s)',
    fast: 'Fast (1s)',

    // Timeline
    noSlice: 'No slice',
    addNewSlice: 'Add new time slice',
    initialState: 'Initial State',
    time: 'Time',

    // Legend
    showLegend: 'Show legend',
    relationships: 'Relationships',
    people: 'People',
    controls: 'Controls',
    male: 'Male',
    female: 'Female',
    deceased: 'Deceased',
    dragHandle: 'Drag',
    moveNode: 'Move node',
    shiftDrag: 'Shift+drag',
    multiSelect: 'Multi-select',
    clickNode: 'Click node',
    selectForRelationship: 'Select for relationship',
    rightClick: 'Right-click',
    optionsMenu: 'Options menu',

    // Relationship Types
    marriage: 'Marriage',
    divorce: 'Divorce',
    yibum: 'Yibum',
    chalitzah: 'Chalitzah',
    parentChild: 'Parent-Child',
    sibling: 'Sibling',
    unmarriedRelations: 'Unmarried Relations',

    // Add Person Modal
    addPerson: 'Add Person',
    addChild: 'Add Child',
    name: 'Name',
    enterName: 'Enter name',
    gender: 'Gender',
    cancel: 'Cancel',
    add: 'Add',
    save: 'Save',

    // Edit Description Modal
    editDescription: 'Edit Description',
    enterDescription: 'Enter description...',

    // Context Menu - Slice
    deleteSlice: 'Delete Slice',
    deleteSliceConfirm: 'Are you sure you want to delete this slice? This cannot be undone.',

    // Context Menu - Person
    markAsDead: 'Mark as Dead',
    removeFromAllSlices: 'Remove from All Slices',
    removePersonConfirm: 'from ALL slices? This cannot be undone.',
    addMarriage: 'Add Marriage',
    addUnmarriedRelations: 'Add Unmarried Relations',
    sameGenderError: 'Cannot add relationship between two people of the same sex',

    // Context Menu - Edge
    markAsDivorced: 'Mark as Divorced',
    removeRelationship: 'Remove Relationship',

    // Language
    language: 'Language',
    english: 'English',
    hebrew: 'Hebrew',
  },

  he: {
    // App-level
    untitledGraph: 'גרף ללא שם',

    // Toolbar
    exportJson: 'ייצוא JSON',
    importJson: 'ייבוא JSON',
    reset: 'איפוס',
    resetConfirm: 'האם אתה בטוח שברצונך לאפס את הגרף? פעולה זו אינה ניתנת לביטול.',
    importFailed: 'הייבוא נכשל:',

    // View Mode
    focusMode: 'מצב מיקוד',
    overviewMode: 'מצב סקירה',
    enterFocusMode: 'כניסה למצב מיקוד (מצגת)',
    exitToOverview: 'יציאה למצב סקירה',

    // Playback
    play: 'נגן',
    pause: 'השהה',
    playbackSpeed: 'מהירות ניגון',
    slow: 'איטי (3 שניות)',
    medium: 'בינוני (2 שניות)',
    fast: 'מהיר (שנייה)',

    // Timeline
    noSlice: 'אין פרוסה',
    addNewSlice: 'הוסף פרוסת זמן חדשה',
    initialState: 'מצב התחלתי',
    time: 'זמן',

    // Legend
    showLegend: 'הצג מקרא',
    relationships: 'יחסים',
    people: 'אנשים',
    controls: 'פקדים',
    male: 'זכר',
    female: 'נקבה',
    deceased: 'נפטר',
    dragHandle: 'גרור',
    moveNode: 'הזז צומת',
    shiftDrag: 'Shift+גרירה',
    multiSelect: 'בחירה מרובה',
    clickNode: 'לחץ על צומת',
    selectForRelationship: 'בחר ליחס',
    rightClick: 'קליק ימני',
    optionsMenu: 'תפריט אפשרויות',

    // Relationship Types
    marriage: 'נישואין',
    divorce: 'גירושין',
    yibum: 'יבום',
    chalitzah: 'חליצה',
    parentChild: 'הורה-ילד',
    sibling: 'אח/ות',
    unmarriedRelations: 'זוגיות ללא נישואין',

    // Add Person Modal
    addPerson: 'הוסף אדם',
    addChild: 'הוסף ילד',
    name: 'שם',
    enterName: 'הכנס שם',
    gender: 'מין',
    cancel: 'ביטול',
    add: 'הוסף',
    save: 'שמור',

    // Edit Description Modal
    editDescription: 'ערוך תיאור',
    enterDescription: 'הכנס תיאור...',

    // Context Menu - Slice
    deleteSlice: 'מחק פרוסה',
    deleteSliceConfirm: 'האם אתה בטוח שברצונך למחוק פרוסה זו? פעולה זו אינה ניתנת לביטול.',

    // Context Menu - Person
    markAsDead: 'סמן כנפטר',
    removeFromAllSlices: 'הסר מכל הפרוסות',
    removePersonConfirm: 'מכל הפרוסות? פעולה זו אינה ניתנת לביטול.',
    addMarriage: 'הוסף נישואין',
    addUnmarriedRelations: 'הוסף זוגיות ללא נישואין',
    sameGenderError: 'לא ניתן להוסיף יחס בין שני אנשים מאותו מין',

    // Context Menu - Edge
    markAsDivorced: 'סמן כגרוש',
    removeRelationship: 'הסר יחס',

    // Language
    language: 'שפה',
    english: 'אנגלית',
    hebrew: 'עברית',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

// Helper to get relationship label key
export const relationshipTypeToKey: Record<string, TranslationKey> = {
  'marriage': 'marriage',
  'divorce': 'divorce',
  'yibum': 'yibum',
  'chalitzah': 'chalitzah',
  'parent-child': 'parentChild',
  'sibling': 'sibling',
  'unmarried-relations': 'unmarriedRelations',
};
