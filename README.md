# Yevamos: 3D Temporal Family Graph Visualization

> *A modern approach to an ancient problem: visualizing family relationships that change over time*

**[Live Demo](https://example.com/yevamos)** | **[Example Graph: Classic Yevamos Case](https://example.com/yevamos#data=...)**

---

## The Problem: Time as a Missing Dimension

Family trees are inherently two-dimensional structures—parents above, children below, siblings side-by-side. But families don't exist in a single frozen moment. People are born, marry, divorce, and die. Relationships transform. A woman who was forbidden to one man may later become obligated to marry him. A brother who didn't exist when a marriage occurred changes the entire legal picture when he's born.

Traditional diagrams attempt to represent these temporal changes within a flat 2D space. The results are predictably cluttered:

- **Numbered annotations** ("1. Reuven marries Leah, 2. Reuven dies, 3. Shimon performs yibum...")
- **Multiple line styles** (solid for current marriages, dashed for past, dotted for potential)
- **Color-coded overlays** that require a legend to decode
- **Separate diagrams** for each point in time, losing the continuity between states

These approaches all share the same fundamental limitation: they're trying to squeeze a third dimension (time) into a space that's already fully utilized. The result is cognitive overload—readers must mentally reconstruct the temporal sequence from visual noise.

## The Solution: Time as the Z-Axis

Yevamos takes a different approach: **what if time literally *were* a third dimension?**

Each moment in the family's history exists on its own 2D plane. These planes are stacked along the Z-axis, creating a 3D space where you can see the entire history at once—or focus on a single moment. Navigate forward and backward through time like flipping through pages, while maintaining spatial awareness of where you've been and where you're going.

```
        Z (Time)
        ↑
        │    ┌─────────────┐
        │    │  t=2: Now   │  ← Current slice (bright, interactive)
        │    └─────────────┘
        │   ┌─────────────┐
        │   │  t=1: Past  │    ← Previous state (faded)
        │   └─────────────┘
        │  ┌─────────────┐
        │  │ t=0: Start  │     ← Initial state (faded)
        │  └─────────────┘
        └──────────────────→ X,Y (Family relationships)
```

## Background: Yibum and Chalitzah

This tool was built specifically to visualize cases from **Tractate Yevamos** in the Talmud, which deals with *yibum* (levirate marriage) and *chalitzah* (the release ceremony).

### The Basic Law

When a married man dies without children, the Torah prescribes a specific obligation: his brother should marry the widow. This is *yibum*—from the Hebrew *yavam* (brother-in-law). The firstborn son of this union is considered, in a legal sense, a continuation of the deceased brother's line.

If the brother chooses not to perform yibum, he must perform *chalitzah*—a ceremony releasing both parties from the obligation, after which the widow may marry anyone.

### Why It Gets Complicated

The Talmud dedicates an entire tractate to this topic because the interactions between multiple brothers, multiple wives, and forbidden relationships create intricate logical puzzles:

- **Multiple brothers**: If a man had several brothers, which one should perform yibum?
- **Multiple wives**: If the deceased had multiple wives, what happens to each?
- **Forbidden relationships**: What if the widow is the brother's sister-in-law through *another* marriage? Or his wife's sister?
- **Temporal complications**: What if a brother was born *after* the original marriage? What if he converted to Judaism after the death?

These cases require tracking not just *who* is related to *whom*, but *when* each relationship began and ended, and how the legal picture changes at each moment.

## Technical Architecture

### Delta-Based Temporal Model

Rather than storing complete snapshots of the family state at each point in time, Yevamos uses a **delta-based model**:

```typescript
interface TemporalGraph {
  nodes: Record<string, Person>;       // Global person definitions
  edges: Record<string, Relationship>; // Global relationship definitions
  slices: TimeSlice[];                 // Timeline of events
}

interface TimeSlice {
  id: string;
  label: string;                       // "Reuven dies", "Shimon is born", etc.
  events: TemporalEvent[];             // What changes at this moment
}
```

**Global definitions** store immutable properties (name, gender, node color). **Time slices** store events that modify the graph state. To render any point in time, the system resolves all events up to that slice index.

This approach offers several advantages:
- **Efficient storage**: Only changes are recorded, not redundant full states
- **Clean diffs**: Easy to see exactly what changed between any two moments
- **Flexible insertion**: New time slices can be inserted anywhere in the sequence

### Event Types

| Event | Description |
|-------|-------------|
| `addNode` | A person enters the family (birth, marriage into family, etc.) |
| `death` | A person dies (visually faded, legally significant) |
| `addEdge` | A relationship is created (marriage, birth of child) |
| `updateEdge` | A relationship changes (marriage → divorce) |
| `removeEdge` | A relationship is removed |

### Relationship Types

| Type | Visual Style | Description |
|------|--------------|-------------|
| `marriage` | Solid green | Active marriage |
| `divorce` | Dashed red | Dissolved marriage |
| `yibum` | Solid gold (thick) | Levirate marriage performed |
| `chalitzah` | Dashed purple | Release ceremony performed |
| `parent-child` | Solid cyan with arrow | Parent-child relationship |
| `sibling` | Solid gray (thin) | Sibling relationship |
| `unmarried-relations` | Dotted orange | Non-marital relationship |

### 3D Rendering

Built with **React Three Fiber** (React bindings for Three.js):

- Each time slice is a semi-transparent vertical plane positioned along the Z-axis
- People are rendered as colored nodes with emoji indicators
- Relationships are rendered as styled lines (solid, dashed, dotted)
- **Cross-slice continuity lines** connect the same person across adjacent time slices
- **Folder-tab navigation** on each slice for quick temporal navigation

### Persistence & Sharing

**Three persistence mechanisms:**

1. **Auto-save**: Graphs automatically persist to `localStorage`
2. **JSON Export/Import**: Download and upload complete graph files
3. **URL Encoding**: Share graphs via URL using Base64-encoded data in the hash fragment

```
https://example.com/yevamos#data=eyJ0aXRsZSI6IkNsYXNza...
```

The URL encoding allows sharing complex family scenarios with a single link—useful for Torah study, classroom instruction, or halachic discussions.

## Features

### Interactive Editing
- **Add people** via right-click context menu
- **Create relationships** by selecting two people
- **Drag nodes** to arrange the family layout
- **Multi-select** with Shift+drag for group operations
- **Mark deaths** to show temporal transitions

### Navigation
- **Timeline slider** for quick scrubbing through history
- **Arrow keys** (←→ or ↑↓) for slice-by-slice navigation
- **Clickable folder tabs** on each slice for direct access
- **Overview mode**: Orbit camera to see all slices at once
- **Focus mode**: Animated walkthrough with playback controls

### Playback
- **Play/Pause** automatic progression through time
- **Speed control**: Slow (3s), Medium (2s), Fast (1s) per slice
- **Change highlighting**: New people glow green, deaths glow red

### Localization
- English and Hebrew interface
- RTL support for Hebrew text

## Future Directions

### LLM-Powered Graph Generation
Natural language input to generate family graphs:
> "Reuven has two brothers, Shimon and Levi. Reuven marries Leah and Rachel. Reuven dies childless. What are the yibum obligations?"

An LLM could parse this description and generate the corresponding temporal graph, making the tool accessible to users without manual graph construction.

### Halachic Overlay
Integration with Talmudic sources:
- Link graph states to specific Gemara passages
- Display relevant halachic arguments at each time slice
- Show which Rishonim/Acharonim discuss each case configuration

### Safek (Doubt) Handling via Slice Forking
When the facts are uncertain, Jewish law often requires considering multiple possibilities. The graph could support **forking**—a single slice branches into multiple parallel timelines representing different factual scenarios, each with its own halachic implications.

```
                    ┌─→ [If child is viable] → ...
       t=2 ────────┤
                    └─→ [If child is not viable] → ...
```

### Additional UI Improvements
- **Minimap**: Small overview showing position in the full timeline
- **Search**: Find people or relationships across all time slices
- **Annotations**: Add notes and citations to specific graph elements
- **Diff view**: Side-by-side comparison of two time slices
- **Export to image/PDF**: Generate static diagrams for print

### Collaborative Editing
Real-time multi-user editing for chavrusa study or classroom use.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **React 18** with TypeScript
- **Three.js** via React Three Fiber + Drei
- **Zustand** for state management
- **Vite** for build tooling

## License

MIT License - See [LICENSE](LICENSE) for details.

---

*Built to illuminate the intricate logic of Tractate Yevamos, but applicable to any domain where family relationships evolve over time.*
