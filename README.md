# Yevamos: 3D Temporal Family Graph Visualization

> *A modern approach to an ancient problem: visualizing family relationships that change over time*

**[Live Demo](https://nossonhuebner.github.io/yevamos-vibes/)** | **[Example Graph: Classic Yevamos Case](https://nossonhuebner.github.io/yevamos-vibes/#data=eyJub2RlcyI6eyIxNzY2NzU4NDQ2OTU4LXJyM2FsMjFuZiI6eyJuYW1lIjoiWWFrb3YiLCJnZW5kZXIiOiJtYWxlIiwicG9zaXRpb24iOnsieCI6LTcuMDYxMTU0MjMxNzY5NzA2LCJ5IjoxMS42MjQ1MDYyNDAyMjE5NjV9LCJpZCI6IjE3NjY3NTg0NDY5NTgtcnIzYWwyMW5mIiwiY29sb3IiOiIjOWI1OWI2IiwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjB9LCIxNzY2NzU4NDU0MzYwLWZhZWw0b2QxbiI6eyJuYW1lIjoiTGVhaCIsImdlbmRlciI6ImZlbWFsZSIsInBvc2l0aW9uIjp7IngiOi0wLjkyNDExMTExNjczODU1NDYsInkiOjExLjQ2NjU5OTczMTk0MTA3NH0sImlkIjoiMTc2Njc1ODQ1NDM2MC1mYWVsNG9kMW4iLCJjb2xvciI6IiM5YjU5YjYiLCJpbnRyb2R1Y2VkU2xpY2VJbmRleCI6MH0sIjE3NjY3NTg0NjkyNjctM2hvNjhqZTJhIjp7Im5hbWUiOiJSZXV2ZW4iLCJnZW5kZXIiOiJtYWxlIiwicG9zaXRpb24iOnsieCI6LTIuMzcyNDQwMTMzNjc5OTQyMywieSI6OC40NzI1MzU2NjQ1MDYwODN9LCJpZCI6IjE3NjY3NTg0NjkyNjctM2hvNjhqZTJhIiwiY29sb3IiOiIjMmVjYzcxIiwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjF9LCIxNzY2NzU4NDkzMDMxLXJwdTNiZnlpMSI6eyJuYW1lIjoiRGluYSIsImdlbmRlciI6ImZlbWFsZSIsInBvc2l0aW9uIjp7IngiOjMuMTk4NDMxNDE5NzQ3MzIsInkiOjguNTc0MzIwNTc4MjIwMDg1fSwiaWQiOiIxNzY2NzU4NDkzMDMxLXJwdTNiZnlpMSIsImNvbG9yIjoiIzE2YTA4NSIsImludHJvZHVjZWRTbGljZUluZGV4IjoxfSwiMTc2Njc1ODYyMTk5Ny1zaTk5ZTdoNjkiOnsibmFtZSI6IlNoaW1vbiIsImdlbmRlciI6Im1hbGUiLCJwb3NpdGlvbiI6eyJ4Ijo2Ljk4MDI3MzEzNTAzMjcwNywieSI6Ny4zMzcxNTcwNDkzNjU2Mzh9LCJpZCI6IjE3NjY3NTg2MjE5OTctc2k5OWU3aDY5IiwiY29sb3IiOiIjOGU0NGFkIiwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjV9LCIxNzY2NzU4NjYxMDk3LXVuem1naDRiMSI6eyJuYW1lIjoiTGV2aSIsImdlbmRlciI6Im1hbGUiLCJwb3NpdGlvbiI6eyJ4Ijo3Ljc2MzQyNDcyNzk2MDMyOCwieSI6NC4yNDM0MTAzMzE3OTMxNjF9LCJpZCI6IjE3NjY3NTg2NjEwOTctdW56bWdoNGIxIiwiY29sb3IiOiIjMWFiYzljIiwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjZ9LCIxNzY2NzU4Njc3NzY3LWVnOTlzczdycCI6eyJuYW1lIjoiUm9jaGVsIiwiZ2VuZGVyIjoiZmVtYWxlIiwicG9zaXRpb24iOnsieCI6Mi42MjM3ODUzNzY4NzE2MDQsInkiOjQuNDIxMDc5MjM1NTcxMjM2fSwiaWQiOiIxNzY2NzU4Njc3NzY3LWVnOTlzczdycCIsImNvbG9yIjoiIzI5ODBiOSIsImludHJvZHVjZWRTbGljZUluZGV4Ijo2fSwiMTc2Njc1ODczMzUyOC1lMnc0MjFxM24iOnsibmFtZSI6Illpc2FjaGFyIiwiZ2VuZGVyIjoibWFsZSIsInBvc2l0aW9uIjp7IngiOjAuMTI1NjcyNjIxNTk1ODMwOCwieSI6Mi40MjEwNzkyMzU1NzEyMzZ9LCJpZCI6IjE3NjY3NTg3MzM1MjgtZTJ3NDIxcTNuIiwiY29sb3IiOiIjZTY3ZTIyIiwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjh9fSwiZWRnZXMiOnsiMTc2Njc1ODQ2MDc1NC02M2p0ZTV5bXoiOnsidHlwZSI6Im1hcnJpYWdlIiwic291cmNlSWQiOiIxNzY2NzU4NDU0MzYwLWZhZWw0b2QxbiIsInRhcmdldElkIjoiMTc2Njc1ODQ0Njk1OC1ycjNhbDIxbmYiLCJpZCI6IjE3NjY3NTg0NjA3NTQtNjNqdGU1eW16IiwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjAsImNoaWxkSWRzIjpbIjE3NjY3NTg0NjkyNjctM2hvNjhqZTJhIl19LCIxNzY2NzU4NDY5MjY3LWY4NXZ6amM2biI6eyJpZCI6IjE3NjY3NTg0NjkyNjctZjg1dnpqYzZuIiwidHlwZSI6InBhcmVudC1jaGlsZCIsInNvdXJjZUlkIjoiMTc2Njc1ODQ1NDM2MC1mYWVsNG9kMW4iLCJ0YXJnZXRJZCI6IjE3NjY3NTg0NjkyNjctM2hvNjhqZTJhIiwiaGlkZGVuIjp0cnVlLCJpbnRyb2R1Y2VkU2xpY2VJbmRleCI6MX0sIjE3NjY3NTg0NjkyNjctYXphNHI1MDh4Ijp7ImlkIjoiMTc2Njc1ODQ2OTI2Ny1hemE0cjUwOHgiLCJ0eXBlIjoicGFyZW50LWNoaWxkIiwic291cmNlSWQiOiIxNzY2NzU4NDQ2OTU4LXJyM2FsMjFuZiIsInRhcmdldElkIjoiMTc2Njc1ODQ2OTI2Ny0zaG82OGplMmEiLCJoaWRkZW4iOnRydWUsImludHJvZHVjZWRTbGljZUluZGV4IjoxfSwiMTc2Njc1ODU1MDcxNC0zZXYzczM4cnoiOnsidHlwZSI6InVubWFycmllZC1yZWxhdGlvbnMiLCJzb3VyY2VJZCI6IjE3NjY3NTg0OTMwMzEtcnB1M2JmeWkxIiwidGFyZ2V0SWQiOiIxNzY2NzU4NDY5MjY3LTNobzY4amUyYSIsImlkIjoiMTc2Njc1ODU1MDcxNC0zZXYzczM4cnoiLCJpbnRyb2R1Y2VkU2xpY2VJbmRleCI6Mn0sIjE3NjY3NTg1OTczMTAtMDE4enNiNGxkIjp7InR5cGUiOiJtYXJyaWFnZSIsInNvdXJjZUlkIjoiMTc2Njc1ODQ5MzAzMS1ycHUzYmZ5aTEiLCJ0YXJnZXRJZCI6IjE3NjY3NTg0NjkyNjctM2hvNjhqZTJhIiwiaWQiOiIxNzY2NzU4NTk3MzEwLTAxOHpzYjRsZCIsImludHJvZHVjZWRTbGljZUluZGV4IjozfSwiMTc2Njc1ODY0Njg3Mi1iODFvYWdtYmQiOnsidHlwZSI6Im1hcnJpYWdlIiwic291cmNlSWQiOiIxNzY2NzU4NjIxOTk3LXNpOTllN2g2OSIsInRhcmdldElkIjoiMTc2Njc1ODQ5MzAzMS1ycHUzYmZ5aTEiLCJpZCI6IjE3NjY3NTg2NDY4NzItYjgxb2FnbWJkIiwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjUsImNoaWxkSWRzIjpbIjE3NjY3NTg2NjEwOTctdW56bWdoNGIxIiwiMTc2Njc1ODY3Nzc2Ny1lZzk5c3M3cnAiXX0sIjE3NjY3NTg2NjEwOTctZ2JvZWUyM2djIjp7ImlkIjoiMTc2Njc1ODY2MTA5Ny1nYm9lZTIzZ2MiLCJ0eXBlIjoicGFyZW50LWNoaWxkIiwic291cmNlSWQiOiIxNzY2NzU4NjIxOTk3LXNpOTllN2g2OSIsInRhcmdldElkIjoiMTc2Njc1ODY2MTA5Ny11bnptZ2g0YjEiLCJoaWRkZW4iOnRydWUsImludHJvZHVjZWRTbGljZUluZGV4Ijo2fSwiMTc2Njc1ODY2MTA5Ny1xaGRiYjR3a3UiOnsiaWQiOiIxNzY2NzU4NjYxMDk3LXFoZGJiNHdrdSIsInR5cGUiOiJwYXJlbnQtY2hpbGQiLCJzb3VyY2VJZCI6IjE3NjY3NTg0OTMwMzEtcnB1M2JmeWkxIiwidGFyZ2V0SWQiOiIxNzY2NzU4NjYxMDk3LXVuem1naDRiMSIsImhpZGRlbiI6dHJ1ZSwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjZ9LCIxNzY2NzU4Njc3NzY3LXJhcDhvcXphZCI6eyJpZCI6IjE3NjY3NTg2Nzc3NjctcmFwOG9xemFkIiwidHlwZSI6InBhcmVudC1jaGlsZCIsInNvdXJjZUlkIjoiMTc2Njc1ODYyMTk5Ny1zaTk5ZTdoNjkiLCJ0YXJnZXRJZCI6IjE3NjY3NTg2Nzc3NjctZWc5OXNzN3JwIiwiaGlkZGVuIjp0cnVlLCJpbnRyb2R1Y2VkU2xpY2VJbmRleCI6Nn0sIjE3NjY3NTg2Nzc3NjctMHJ3dXZjODlzIjp7ImlkIjoiMTc2Njc1ODY3Nzc2Ny0wcnd1dmM4OXMiLCJ0eXBlIjoicGFyZW50LWNoaWxkIiwic291cmNlSWQiOiIxNzY2NzU4NDkzMDMxLXJwdTNiZnlpMSIsInRhcmdldElkIjoiMTc2Njc1ODY3Nzc2Ny1lZzk5c3M3cnAiLCJoaWRkZW4iOnRydWUsImludHJvZHVjZWRTbGljZUluZGV4Ijo2fSwiMTc2Njc1ODY5NjQzMi1mdzYwdTAyMjAiOnsidHlwZSI6InVubWFycmllZC1yZWxhdGlvbnMiLCJzb3VyY2VJZCI6IjE3NjY3NTg0NjkyNjctM2hvNjhqZTJhIiwidGFyZ2V0SWQiOiIxNzY2NzU4Njc3NzY3LWVnOTlzczdycCIsImlkIjoiMTc2Njc1ODY5NjQzMi1mdzYwdTAyMjAiLCJpbnRyb2R1Y2VkU2xpY2VJbmRleCI6NywiY2hpbGRJZHMiOlsiMTc2Njc1ODczMzUyOC1lMnc0MjFxM24iXX0sIjE3NjY3NTg3MzM1MjgtbWZod3Y0Z3J4Ijp7ImlkIjoiMTc2Njc1ODczMzUyOC1tZmh3djRncngiLCJ0eXBlIjoicGFyZW50LWNoaWxkIiwic291cmNlSWQiOiIxNzY2NzU4NDY5MjY3LTNobzY4amUyYSIsInRhcmdldElkIjoiMTc2Njc1ODczMzUyOC1lMnc0MjFxM24iLCJoaWRkZW4iOnRydWUsImludHJvZHVjZWRTbGljZUluZGV4Ijo4fSwiMTc2Njc1ODczMzUyOC1udXY5aHVscDQiOnsiaWQiOiIxNzY2NzU4NzMzNTI4LW51djlodWxwNCIsInR5cGUiOiJwYXJlbnQtY2hpbGQiLCJzb3VyY2VJZCI6IjE3NjY3NTg2Nzc3NjctZWc5OXNzN3JwIiwidGFyZ2V0SWQiOiIxNzY2NzU4NzMzNTI4LWUydzQyMXEzbiIsImhpZGRlbiI6dHJ1ZSwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjh9fSwic2xpY2VzIjpbeyJpZCI6IjE3NjY3NTg0MTgzNjYtYXR2dWZjeGU1IiwibGFiZWwiOiJJbml0aWFsIFN0YXRlIiwiZXZlbnRzIjpbeyJ0eXBlIjoiYWRkTm9kZSIsIm5vZGVJZCI6IjE3NjY3NTg0NDY5NTgtcnIzYWwyMW5mIn0seyJ0eXBlIjoiYWRkTm9kZSIsIm5vZGVJZCI6IjE3NjY3NTg0NTQzNjAtZmFlbDRvZDFuIn0seyJ0eXBlIjoiYWRkRWRnZSIsImVkZ2VJZCI6IjE3NjY3NTg0NjA3NTQtNjNqdGU1eW16In1dfSx7ImlkIjoiMTc2Njc1ODQ2MjIzNi1vNDdmN2JvaTAiLCJsYWJlbCI6IlRpbWUgMSIsImV2ZW50cyI6W3sidHlwZSI6ImFkZE5vZGUiLCJub2RlSWQiOiIxNzY2NzU4NDY5MjY3LTNobzY4amUyYSJ9LHsidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2NzU4NDY5MjY3LWY4NXZ6amM2biJ9LHsidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2NzU4NDY5MjY3LWF6YTRyNTA4eCJ9LHsidHlwZSI6ImFkZE5vZGUiLCJub2RlSWQiOiIxNzY2NzU4NDkzMDMxLXJwdTNiZnlpMSJ9XX0seyJpZCI6IjE3NjY3NTg1MzEzMTAtamY3ZjE2YzVhIiwibGFiZWwiOiJUaW1lIDIiLCJldmVudHMiOlt7InR5cGUiOiJhZGRFZGdlIiwiZWRnZUlkIjoiMTc2Njc1ODU1MDcxNC0zZXYzczM4cnoifV19LHsiaWQiOiIxNzY2NzU4NTUyMDI3LWYybWkwMDViNyIsImxhYmVsIjoiVGltZSAzIiwiZXZlbnRzIjpbeyJ0eXBlIjoiYWRkRWRnZSIsImVkZ2VJZCI6IjE3NjY3NTg1OTczMTAtMDE4enNiNGxkIn1dfSx7ImlkIjoiMTc2Njc1ODYwMTY1MS1yYjk3bmxsb2QiLCJsYWJlbCI6IlRpbWUgNCIsImV2ZW50cyI6W3sidHlwZSI6InVwZGF0ZUVkZ2UiLCJlZGdlSWQiOiIxNzY2NzU4NTk3MzEwLTAxOHpzYjRsZCIsImNoYW5nZXMiOnsidHlwZSI6ImRpdm9yY2UifX1dfSx7ImlkIjoiMTc2Njc1ODYxMTA1OS15OGVqdDBqODYiLCJsYWJlbCI6IlRpbWUgNSIsImV2ZW50cyI6W3sidHlwZSI6ImFkZE5vZGUiLCJub2RlSWQiOiIxNzY2NzU4NjIxOTk3LXNpOTllN2g2OSJ9LHsidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2NzU4NjQ2ODcyLWI4MW9hZ21iZCJ9XX0seyJpZCI6IjE3NjY3NTg2NDkyNDAtdGRlam1sZmdqIiwibGFiZWwiOiJUaW1lIDYiLCJldmVudHMiOlt7InR5cGUiOiJhZGROb2RlIiwibm9kZUlkIjoiMTc2Njc1ODY2MTA5Ny11bnptZ2g0YjEifSx7InR5cGUiOiJhZGRFZGdlIiwiZWRnZUlkIjoiMTc2Njc1ODY2MTA5Ny1nYm9lZTIzZ2MifSx7InR5cGUiOiJhZGRFZGdlIiwiZWRnZUlkIjoiMTc2Njc1ODY2MTA5Ny1xaGRiYjR3a3UifSx7InR5cGUiOiJhZGROb2RlIiwibm9kZUlkIjoiMTc2Njc1ODY3Nzc2Ny1lZzk5c3M3cnAifSx7InR5cGUiOiJhZGRFZGdlIiwiZWRnZUlkIjoiMTc2Njc1ODY3Nzc2Ny1yYXA4b3F6YWQifSx7InR5cGUiOiJhZGRFZGdlIiwiZWRnZUlkIjoiMTc2Njc1ODY3Nzc2Ny0wcnd1dmM4OXMifV19LHsiaWQiOiIxNzY2NzU4Njg4NzA1LXFoZHR5NThnYSIsImxhYmVsIjoiVGltZSA3IiwiZXZlbnRzIjpbeyJ0eXBlIjoiYWRkRWRnZSIsImVkZ2VJZCI6IjE3NjY3NTg2OTY0MzItZnc2MHUwMjIwIn1dfSx7ImlkIjoiMTc2Njc1ODY5ODcxMi1pZG1obHVjanQiLCJsYWJlbCI6IlRpbWUgOCIsImV2ZW50cyI6W3sidHlwZSI6ImFkZE5vZGUiLCJub2RlSWQiOiIxNzY2NzU4NzMzNTI4LWUydzQyMXEzbiJ9LHsidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2NzU4NzMzNTI4LW1maHd2NGdyeCJ9LHsidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2NzU4NzMzNTI4LW51djlodWxwNCJ9XX1dLCJtZXRhZGF0YSI6eyJ0aXRsZSI6IlVudGl0bGVkIEdyYXBoIiwiZGVzY3JpcHRpb24iOiIifX0=)**

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
