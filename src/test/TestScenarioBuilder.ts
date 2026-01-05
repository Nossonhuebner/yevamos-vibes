/**
 * TestScenarioBuilder - Fluent API for building test scenarios
 *
 * Creates TemporalGraph structures for testing halachic rules.
 * Reads like documentation - each test scenario tells a family story.
 *
 * Example:
 *   const graph = new TestScenarioBuilder()
 *     .addPerson('yaakov', 'male')
 *     .addPerson('leah', 'female')
 *     .marry('yaakov', 'leah')
 *     .addChild('yaakov', 'leah', 'reuven', 'male')
 *     .nextSlice('Reuven marries')
 *     .addPerson('rochel', 'female')
 *     .marry('reuven', 'rochel')
 *     .nextSlice('Reuven dies')
 *     .die('reuven')
 *     .build();
 */

import {
  TemporalGraph,
  Person,
  Relationship,
  TimeSlice,
  RelationshipType,
  NODE_COLOR_PALETTE,
} from '@/types';

export class TestScenarioBuilder {
  private graph: TemporalGraph;
  private currentSliceIndex: number = 0;
  private people: Map<string, string> = new Map(); // name → id
  private nextPersonIndex: number = 1;
  private nextEdgeIndex: number = 1;
  private colorIndex: number = 0;

  constructor(title: string = 'Test Scenario') {
    this.graph = {
      nodes: {},
      edges: {},
      slices: [
        {
          id: 'slice-0',
          label: 'Initial',
          events: [],
        },
      ],
      metadata: { title },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Person Management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Add a person to the scenario.
   * Uses the name as a convenient reference (actual ID is generated).
   */
  addPerson(name: string, gender: 'male' | 'female'): this {
    if (this.people.has(name)) {
      throw new Error(`Person "${name}" already exists`);
    }

    const id = `person-${this.nextPersonIndex++}`;
    this.people.set(name, id);

    const person: Person = {
      id,
      name,
      gender,
      position: { x: this.nextPersonIndex * 2, y: 0 },
      color: this.getNextColor(),
      introducedSliceIndex: this.currentSliceIndex,
    };

    this.graph.nodes[id] = person;
    this.currentSlice.events.push({ type: 'addNode', nodeId: id });

    return this;
  }

  /**
   * Add a sibling to an existing person (shares parents).
   * Creates the sibling relationship through shared parent-child edges.
   */
  addSibling(existingPerson: string, siblingName: string, gender: 'male' | 'female'): this {
    const existingId = this.requirePerson(existingPerson);

    // Add the new person
    this.addPerson(siblingName, gender);
    const siblingId = this.people.get(siblingName)!;

    // Find the existing person's parents and link the sibling to them
    const parentEdges = Object.values(this.graph.edges).filter(
      (e) => e.type === 'parent-child' && e.targetId === existingId
    );

    for (const parentEdge of parentEdges) {
      const parentId = parentEdge.sourceId;
      this.addParentChildEdge(parentId, siblingId);
    }

    // If no parents found, create a shared parent
    if (parentEdges.length === 0) {
      // Create an implicit parent to link siblings
      const parentId = `person-${this.nextPersonIndex++}`;
      const parentPerson: Person = {
        id: parentId,
        name: `_parent_of_${existingPerson}`,
        gender: 'male',
        position: { x: 0, y: -2 },
        color: this.getNextColor(),
        introducedSliceIndex: this.currentSliceIndex,
      };
      this.graph.nodes[parentId] = parentPerson;
      this.currentSlice.events.push({ type: 'addNode', nodeId: parentId });

      this.addParentChildEdge(parentId, existingId);
      this.addParentChildEdge(parentId, siblingId);
    }

    return this;
  }

  /**
   * Mark a person as dead at the current slice.
   */
  die(person: string): this {
    const id = this.requirePerson(person);
    const personObj = this.graph.nodes[id];

    personObj.deathSliceIndex = this.currentSliceIndex;
    this.currentSlice.events.push({ type: 'death', nodeId: id });

    return this;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Relationships
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a marriage (nisuin) between two people.
   */
  marry(person1: string, person2: string): this {
    return this.addRelationship(person1, person2, 'nisuin');
  }

  /**
   * Create an erusin (betrothal) between two people.
   */
  erusin(person1: string, person2: string): this {
    return this.addRelationship(person1, person2, 'erusin');
  }

  /**
   * Divorce two people.
   * Note: Only adds an updateEdge event - the global edge definition
   * stays as 'nisuin'/'erusin' since it represents the initial state.
   * The delta resolver applies updates at the appropriate slice.
   */
  divorce(person1: string, person2: string): this {
    const id1 = this.requirePerson(person1);
    const id2 = this.requirePerson(person2);

    // Find the existing marriage edge
    const marriageEdge = Object.values(this.graph.edges).find(
      (e) =>
        (e.type === 'nisuin' || e.type === 'erusin') &&
        ((e.sourceId === id1 && e.targetId === id2) ||
          (e.sourceId === id2 && e.targetId === id1))
    );

    if (!marriageEdge) {
      throw new Error(`No marriage found between "${person1}" and "${person2}"`);
    }

    // Add update event to change to divorce
    // Do NOT modify the global edge - delta resolver applies this at the right slice
    this.currentSlice.events.push({
      type: 'updateEdge',
      edgeId: marriageEdge.id,
      changes: {
        type: 'divorce',
        divorceFromNisuin: marriageEdge.type === 'nisuin',
      },
    });

    return this;
  }

  /**
   * Add a child to two parents (who should be married or have had relations).
   */
  addChild(
    parent1: string,
    parent2: string,
    childName: string,
    gender: 'male' | 'female'
  ): this {
    const p1Id = this.requirePerson(parent1);
    const p2Id = this.requirePerson(parent2);

    // Add the child person
    this.addPerson(childName, gender);
    const childId = this.people.get(childName)!;

    // Position child below parents
    const childPerson = this.graph.nodes[childId];
    const p1 = this.graph.nodes[p1Id];
    const p2 = this.graph.nodes[p2Id];
    childPerson.position = {
      x: (p1.position.x + p2.position.x) / 2,
      y: Math.max(p1.position.y, p2.position.y) + 2,
    };

    // Add parent-child relationships
    this.addParentChildEdge(p1Id, childId);
    this.addParentChildEdge(p2Id, childId);

    // Find marriage edge and add child to it
    const marriageEdge = Object.values(this.graph.edges).find(
      (e) =>
        (e.type === 'nisuin' || e.type === 'erusin' || e.type === 'unmarried-relations') &&
        ((e.sourceId === p1Id && e.targetId === p2Id) ||
          (e.sourceId === p2Id && e.targetId === p1Id))
    );

    if (marriageEdge) {
      marriageEdge.childIds = marriageEdge.childIds || [];
      marriageEdge.childIds.push(childId);
    }

    return this;
  }

  /**
   * Perform yibum (levirate marriage).
   */
  yibum(yavam: string, yevama: string): this {
    return this.addRelationship(yavam, yevama, 'yibum');
  }

  /**
   * Perform chalitzah (release from levirate obligation).
   */
  chalitzah(yavam: string, yevama: string): this {
    return this.addRelationship(yavam, yevama, 'chalitzah');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Temporal Management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Advance to a new time slice.
   * All subsequent operations happen at this new slice.
   */
  nextSlice(label: string = ''): this {
    const newSlice: TimeSlice = {
      id: `slice-${this.graph.slices.length}`,
      label,
      events: [],
    };
    this.graph.slices.push(newSlice);
    this.currentSliceIndex = this.graph.slices.length - 1;
    return this;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Build & Queries
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Build and return the TemporalGraph.
   */
  build(): TemporalGraph {
    return this.graph;
  }

  /**
   * Get the internal person ID for a name.
   * Useful for assertions.
   */
  getPersonId(name: string): string {
    const id = this.people.get(name);
    if (!id) {
      throw new Error(`Unknown person: "${name}"`);
    }
    return id;
  }

  /**
   * Get a map of all name → id mappings.
   */
  getPersonIds(): Map<string, string> {
    return new Map(this.people);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private get currentSlice(): TimeSlice {
    return this.graph.slices[this.currentSliceIndex];
  }

  private requirePerson(name: string): string {
    const id = this.people.get(name);
    if (!id) {
      throw new Error(`Unknown person: "${name}". Did you forget to addPerson()?`);
    }
    return id;
  }

  private getNextColor(): string {
    const color = NODE_COLOR_PALETTE[this.colorIndex % NODE_COLOR_PALETTE.length];
    this.colorIndex++;
    return color;
  }

  private addRelationship(person1: string, person2: string, type: RelationshipType): this {
    const id1 = this.requirePerson(person1);
    const id2 = this.requirePerson(person2);

    const edgeId = `edge-${this.nextEdgeIndex++}`;
    const edge: Relationship = {
      id: edgeId,
      type,
      sourceId: id1,
      targetId: id2,
      introducedSliceIndex: this.currentSliceIndex,
    };

    this.graph.edges[edgeId] = edge;
    this.currentSlice.events.push({ type: 'addEdge', edgeId });

    return this;
  }

  private addParentChildEdge(parentId: string, childId: string): void {
    const edgeId = `edge-${this.nextEdgeIndex++}`;
    const edge: Relationship = {
      id: edgeId,
      type: 'parent-child',
      sourceId: parentId,
      targetId: childId,
      hidden: true, // Parent-child edges are typically hidden in the UI
      introducedSliceIndex: this.currentSliceIndex,
    };

    this.graph.edges[edgeId] = edge;
    this.currentSlice.events.push({ type: 'addEdge', edgeId });
  }
}

/**
 * Convenience function to create a new builder.
 */
export function scenario(title?: string): TestScenarioBuilder {
  return new TestScenarioBuilder(title);
}
