# LLM Case Builder - Design Document

> Future feature: Allow users to describe Yevamos cases in natural language and automatically build the family tree graph.

## Overview

The goal is to create an LLM-powered interface that:
1. Validates input is a Yevamos-related case
2. Extracts people, relationships, and events
3. Infers implied entities (e.g., brothers share a father)
4. Builds the temporal graph automatically

## Pipeline Architecture

```
User Input (natural language case)
         │
         ▼
┌─────────────────────────────────┐
│  1. VALIDATION LAYER            │
│  - Is this a Yevamos case?      │
│  - Reject off-topic queries     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  2. EXTRACTION LAYER            │
│  - Identify people + genders    │
│  - Extract explicit relations   │
│  - Extract events + ordering    │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  3. INFERENCE LAYER             │
│  - Brothers → shared father     │
│  - Children → parents married   │
│  - Widow + brother → yevama     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  4. GRAPH BUILDER               │
│  - Map to TemporalGraph schema  │
│  - Auto-layout positions        │
│  - Create time slices           │
└─────────────────────────────────┘
         │
         ▼
    Rendered Scene
```

---

## Architectural Options

### Option A: Structured Output (Single Pass)

LLM extracts everything into a JSON schema in one call, then we transform to `TemporalGraph`.

```typescript
// Example LLM output:
{
  "isValidCase": true,
  "people": [
    { "id": "reuven", "name": "ראובן", "gender": "male" },
    { "id": "leah", "name": "לאה", "gender": "female" },
    { "id": "shimon", "name": "שמעון", "gender": "male", "inferredRole": "brother/yavam" }
  ],
  "events": [
    { "slice": 0, "type": "marriage", "husband": "reuven", "wife": "leah" },
    { "slice": 1, "type": "death", "person": "reuven", "description": "ראובן מת בלא בנים" }
  ],
  "inferredEntities": [
    { "type": "parent", "name": "אב", "reason": "ראובן ושמעון אחים - יש להם אב משותף" }
  ]
}
```

**Pros:**
- Fast, single API call
- Lower cost

**Cons:**
- Hard to debug
- All-or-nothing (can't intervene mid-process)
- Complex JSON schema to maintain

### Option B: Tool-Calling Agent (Recommended)

LLM has access to graph-building tools, calls them step by step. User can watch the graph build in real-time.

```typescript
const tools = [
  {
    name: "add_person",
    description: "Add a person to the family tree",
    parameters: {
      name: { type: "string", description: "Person's name" },
      gender: { type: "string", enum: ["male", "female"] },
      inferredFrom: { type: "string", description: "If inferred, explain why (optional)" }
    }
  },
  {
    name: "add_marriage",
    description: "Create a marriage between two people",
    parameters: {
      husband: { type: "string", description: "Name of husband" },
      wife: { type: "string", description: "Name of wife" },
      type: { type: "string", enum: ["erusin", "nisuin"] }
    }
  },
  {
    name: "add_sibling_group",
    description: "Add multiple siblings who share parent(s)",
    parameters: {
      names: { type: "array", items: { type: "string" } },
      genders: { type: "array", items: { type: "string", enum: ["male", "female"] } },
      sharedParent: { type: "string", enum: ["father", "mother", "both"] }
    }
  },
  {
    name: "add_child",
    description: "Add a child to a marriage",
    parameters: {
      marriageId: { type: "string", description: "ID of the parents' marriage" },
      name: { type: "string" },
      gender: { type: "string", enum: ["male", "female"] }
    }
  },
  {
    name: "mark_death",
    description: "Mark that a person has died (creates new time slice)",
    parameters: {
      person: { type: "string", description: "Name of deceased" },
      hadChildren: { type: "boolean", description: "Did they have children at time of death?" }
    }
  },
  {
    name: "add_divorce",
    description: "Divorce a married couple",
    parameters: {
      husband: { type: "string" },
      wife: { type: "string" }
    }
  },
  {
    name: "perform_yibum",
    description: "Record that yibum was performed",
    parameters: {
      yavam: { type: "string", description: "Name of the brother performing yibum" },
      yevama: { type: "string", description: "Name of the widow" }
    }
  },
  {
    name: "perform_chalitzah",
    description: "Record that chalitzah was performed",
    parameters: {
      yavam: { type: "string" },
      yevama: { type: "string" }
    }
  },
  {
    name: "next_time_slice",
    description: "Create a new time slice for subsequent events",
    parameters: {
      description: { type: "string", description: "What happens in this slice" }
    }
  }
];
```

**Pros:**
- Watchable - user sees graph build step-by-step
- Debuggable - can identify which step failed
- Interruptible - user can correct mistakes mid-flow
- Maps directly to existing store actions
- More transparent reasoning

**Cons:**
- More API calls (higher latency and cost)
- Requires streaming UI for good UX

---

## Inference Rules

The LLM needs to understand and apply these domain-specific rules:

| Input Pattern | Inference |
|---------------|-----------|
| "שני אחים" (two brothers) | They share a father (required for yibum d'oraita) |
| "אשת אחיו" (his brother's wife) | Implies: the brother exists, he has a wife, they're married |
| "מת בלא בנים" (died childless) | No children at time of death → potential yibum case |
| "יבמה לשוק" (yevama to the public) | She completed chalitzah with all yevamim |
| "נפלה לפני X" (fell before X) | X is the yavam, she's the yevama after husband's death |
| "צרה" (co-wife) | Another wife of the same husband |
| "צרת ערוה" (co-wife of ervah) | Complex case - the tzara may be exempt from yibum |

### Critical Domain Knowledge

The LLM must understand:
- **What creates zikah**: Death of married man with no children + living brothers
- **What exempts from yibum**: Ervah relationships, mamzerut, certain conversions
- **Temporal ordering**: Marriage must precede children, death creates yibum obligation
- **Multiple yevamim**: All brothers are potential yevamim until chalitzah/yibum

---

## System Prompt (Draft)

```
You are a Yevamos (יבמות) case builder assistant. Your role is to help users
visualize levirate marriage scenarios by building family tree graphs.

## VALIDATION
Only accept cases involving:
- Brothers and their wives
- Death of a married man
- Yibum (levirate marriage) or chalitzah
- Tzaros (co-wives)
- Ervah (forbidden) relationships affecting yibum

If the input is not a Yevamos case, politely explain what types of cases
you can help with and ask for a valid scenario.

## INFERENCE RULES
Apply these automatically:
- Brothers (אחים) share a father (required for yibum d'oraita)
- "מת בלא בנים" (died childless) → deceased had no living children at death
- Wife of deceased brother with no children → she is a יבמה
- Living brothers of deceased → they are יבמים with zikah
- Multiple wives → each is a potential יבמה (unless tzaras ervah)

## BUILD ORDER
1. Identify all people mentioned or implied
2. Start with the oldest generation (parents/shared father if needed)
3. Add siblings together (sibling group)
4. Add marriages in chronological order
5. Add children to marriages
6. Create new time slices for major events:
   - Deaths (especially the husband who creates yibum situation)
   - Divorces
   - Yibum performed
   - Chalitzah performed

## POSITIONING GUIDELINES
- Parents positioned above children
- Siblings positioned side-by-side
- Spouses positioned next to each other
- Children positioned below their parents

## OUTPUT
Use the provided tools to build the graph step by step. Explain your reasoning
for any inferred entities. After building, summarize the halachic situation
(who is zakuk to whom, any exemptions, etc.).
```

---

## UI Design: Scene Builder

### Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  📜 Yevamos Case Builder                                    [?] [×]   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Describe your case in Hebrew or English:                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ראובן נשא את לאה. היו להם שני בנים. ראובן מת.                    │  │
│  │ לראובן יש אח בשם שמעון.                                           │  │
│  │                                                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                        [Build Scene]   │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  Build Log:                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ✓ Added ראובן (male)                                              │  │
│  │ ✓ Added לאה (female)                                              │  │
│  │ ✓ Marriage: ראובן ↔ לאה (nisuin)                                  │  │
│  │ ✓ Added 2 children (בן, בן)                                       │  │
│  │ ℹ Inferred: אב (shared father of ראובן and שמעון)                 │  │
│  │ ✓ Added שמעון (male, brother)                                     │  │
│  │ ✓ New time slice: "פטירת ראובן"                                   │  │
│  │ ✓ Marked ראובן as deceased                                        │  │
│  │                                                                    │  │
│  │ ══════════════════════════════════════════════════════════════    │  │
│  │ 📋 Analysis:                                                       │  │
│  │ לאה is NOT a yevama - ראובן had children (בנים)                   │  │
│  │ No yibum obligation exists in this case.                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  [Accept & Close]  [Edit Manually]  [Try Different Case]              │
└────────────────────────────────────────────────────────────────────────┘
```

### Interaction Flow

1. User opens Case Builder (button in toolbar or modal)
2. Types/pastes case description
3. Clicks "Build Scene"
4. Watches build log populate in real-time
5. Graph renders in background as entities are added
6. Final analysis shown
7. User can:
   - **Accept**: Close modal, keep the built graph
   - **Edit Manually**: Close modal, make manual adjustments
   - **Try Different Case**: Clear and start over

### Error Handling

```
┌──────────────────────────────────────────────────────────────┐
│ ⚠️ Issue Detected                                            │
│                                                              │
│ I found a potential issue with the case:                     │
│ "שמעון is marked as ראובן's brother, but no shared          │
│  parent was mentioned."                                      │
│                                                              │
│ Should I:                                                    │
│ ○ Infer a shared father (typical for yibum cases)           │
│ ○ Infer a shared mother only                                │
│ ○ Ask me to clarify                                         │
│                                                              │
│ [Continue with selected]  [Let me clarify]                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Technical Considerations

### 1. API Choice
- **Claude API**: Best for complex reasoning, good Hebrew support
- **OpenAI**: Good tool-calling support, faster
- **Local model**: Privacy, no cost, but lower quality

### 2. Deployment Model
- **Client-side (user's API key)**: No backend needed, user pays
- **Backend proxy**: You control costs, can add caching
- **Hybrid**: Free tier with limits, BYO key for power users

### 3. Caching Strategy
Common cases could be pre-built and cached:
- "שני אחים ויבמה אחת" (basic case)
- "שלושה אחים ויבמה אחת"
- "ארבעה אחים ושתי יבמות"
- Classic Mishnayos cases from Yevamos

### 4. Cost Estimation
- Average case: ~500-1000 input tokens, ~200-500 output tokens
- With tool calling: 3-10 API calls per case
- Estimated cost: $0.01-0.05 per case (Claude 3.5 Sonnet pricing)

### 5. Error Recovery
- Save intermediate state after each tool call
- Allow "undo last step" functionality
- Provide manual override for any step

---

## Implementation Phases

### Phase 1: Basic Structured Output
- Single API call with JSON schema
- Simple cases only (2-3 people)
- No streaming, show spinner then result

### Phase 2: Tool-Calling Agent
- Multi-step building with tools
- Streaming build log
- Basic inference rules

### Phase 3: Interactive Builder
- Real-time graph updates as tools are called
- Error detection and user prompts
- Halachic analysis at the end

### Phase 4: Advanced Features
- Case library (save/load cases)
- Share cases via URL
- Multiple LLM provider support
- Offline/cached common cases

---

## Open Questions

1. **Hebrew vs English**: Support both? Translate internally?
2. **Ambiguity handling**: When case is unclear, ask user or make assumptions?
3. **Halachic accuracy**: How to ensure LLM doesn't make halachic errors?
4. **Graph layout**: Auto-layout algorithm for complex cases?
5. **Integration point**: New modal? Separate page? Chat sidebar?

---

## References

- Existing graph schema: `src/types/index.ts`
- Store actions: `src/store/graphStore.ts`
- Halachic types: `src/halacha/types.ts`
- Sample rules: `src/halacha/data/sampleRules.ts`
