/**
 * Zikah Tracker
 *
 * Tracks and computes zikah (levirate bond) states.
 * Zikah is created when a married man dies childless, creating a bond
 * between his widow and his brothers.
 */

import { TemporalGraph } from '@/types';
import { GraphQueryEngine, EventRef } from '@/utils/graphQueries';
import { buildEventTimeline } from '@/utils/eventResolver';
import { ZikahInfo, ZikahStatus } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Zikah Record
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Internal record of a zikah relationship.
 */
interface ZikahRecord {
  /**
   * The yevama (widow).
   */
  yevama: string;

  /**
   * The deceased husband.
   */
  deceasedHusband: string;

  /**
   * The marriage that created this zikah potential.
   */
  marriageEdgeId: string;

  /**
   * All yevamim (brothers who could perform yibum).
   */
  yevamim: string[];

  /**
   * When the zikah was created (husband's death).
   */
  createdAt: EventRef;

  /**
   * Slice index where zikah was created.
   */
  createdAtSlice: number;

  /**
   * Current status of the zikah.
   */
  status: ZikahStatus;

  /**
   * If resolved, when it was resolved.
   */
  resolvedAt?: EventRef;

  /**
   * If resolved, how it was resolved.
   */
  resolution?: 'yibum' | 'chalitzah';

  /**
   * If there was a maamar, when it occurred.
   */
  maamarEvent?: EventRef;

  /**
   * Which yavam performed maamar (if any).
   */
  maamarBy?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Zikah Tracker Class
// ═══════════════════════════════════════════════════════════════════════════

export class ZikahTracker {
  private graph: TemporalGraph;
  private engine: GraphQueryEngine;
  private zikahRecords: ZikahRecord[] = [];
  private initialized = false;

  constructor(graph: TemporalGraph) {
    this.graph = graph;
    this.engine = new GraphQueryEngine(graph);
  }

  /**
   * Initialize the tracker by scanning all events for zikah-related changes.
   */
  initialize(): void {
    if (this.initialized) return;

    this.zikahRecords = [];
    this.scanForZikahEvents();
    this.initialized = true;
  }

  /**
   * Scan all events for zikah creation and resolution.
   */
  private scanForZikahEvents(): void {
    const timeline = buildEventTimeline(this.graph);

    for (const { ref, event } of timeline) {
      // Check for death events that might create zikah
      if (event.type === 'death') {
        this.processDeathEvent(event.nodeId, ref);
      }

      // Check for yibum events (updateEdge to yibum type)
      if (event.type === 'updateEdge') {
        if (event.changes.type === 'yibum') {
          this.processYibumEvent(event.edgeId, ref);
        }
        if (event.changes.type === 'chalitzah') {
          this.processChalitzahEvent(event.edgeId, ref);
        }
      }

      // Check for new yibum edges
      if (event.type === 'addEdge') {
        const edge = this.graph.edges[event.edgeId];
        if (edge && edge.type === 'yibum') {
          this.processYibumEdge(event.edgeId, ref);
        }
      }
    }
  }

  /**
   * Process a death event to check for zikah creation.
   */
  private processDeathEvent(deceasedId: string, deathEvent: EventRef): void {
    const deceased = this.graph.nodes[deceasedId];
    if (!deceased || deceased.gender !== 'male') return;

    // Check if deceased was married at time of death
    const relationships = this.engine.getRelationshipsOf(
      deceasedId,
      deathEvent.sliceIndex
    );

    const marriages = relationships.filter(
      (r) =>
        (r.type === 'nisuin' || r.type === 'erusin') &&
        (r.sourceId === deceasedId || r.targetId === deceasedId)
    );

    if (marriages.length === 0) return;

    // Check if deceased had living children at death
    const hadLivingChildren = this.engine.hadLivingChildrenWhen(
      deceasedId,
      deathEvent
    );

    if (hadLivingChildren) return; // No yibum needed

    // Find brothers who were alive at time of death
    const brothers = this.engine
      .getSiblings(deceasedId, deathEvent.sliceIndex)
      .filter((s) => s.gender === 'male');

    const livingBrothers = brothers.filter((b) =>
      this.engine.wasAliveWhen(b.id, deathEvent)
    );

    if (livingBrothers.length === 0) return; // No yevamim

    // Create zikah record for each marriage
    for (const marriage of marriages) {
      const wifeId =
        marriage.sourceId === deceasedId
          ? marriage.targetId
          : marriage.sourceId;

      // Check if wife was alive at death
      if (!this.engine.wasAliveWhen(wifeId, deathEvent)) continue;

      this.zikahRecords.push({
        yevama: wifeId,
        deceasedHusband: deceasedId,
        marriageEdgeId: marriage.id,
        yevamim: livingBrothers.map((b) => b.id),
        createdAt: deathEvent,
        createdAtSlice: deathEvent.sliceIndex,
        status: 'shomeres-yavam',
      });
    }
  }

  /**
   * Process a yibum event (edge type changed to yibum).
   */
  private processYibumEvent(edgeId: string, event: EventRef): void {
    const edge = this.graph.edges[edgeId];
    if (!edge) return;

    // Find the relevant zikah record
    const record = this.findZikahRecord(
      edge.sourceId,
      edge.targetId,
      event.sliceIndex
    );

    if (record) {
      record.status = 'after-yibum';
      record.resolvedAt = event;
      record.resolution = 'yibum';
    }
  }

  /**
   * Process a new yibum edge.
   */
  private processYibumEdge(edgeId: string, event: EventRef): void {
    // Similar to processYibumEvent
    this.processYibumEvent(edgeId, event);
  }

  /**
   * Process a chalitzah event.
   */
  private processChalitzahEvent(edgeId: string, event: EventRef): void {
    const edge = this.graph.edges[edgeId];
    if (!edge) return;

    // Find the relevant zikah record
    const record = this.findZikahRecord(
      edge.sourceId,
      edge.targetId,
      event.sliceIndex
    );

    if (record) {
      record.status = 'after-chalitzah';
      record.resolvedAt = event;
      record.resolution = 'chalitzah';
    }
  }

  /**
   * Find a zikah record for a yevama/yavam pair.
   */
  private findZikahRecord(
    person1: string,
    person2: string,
    beforeSlice: number
  ): ZikahRecord | undefined {
    return this.zikahRecords.find(
      (r) =>
        r.createdAtSlice <= beforeSlice &&
        ((r.yevama === person1 && r.yevamim.includes(person2)) ||
          (r.yevama === person2 && r.yevamim.includes(person1)))
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Public Query Methods
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get zikah info for a person at a given slice.
   */
  getZikahInfo(personId: string, sliceIndex: number): ZikahInfo | null {
    this.initialize();

    const person = this.graph.nodes[personId];
    if (!person) return null;

    if (person.gender === 'female') {
      return this.getYevamaZikahInfo(personId, sliceIndex);
    } else {
      return this.getYavamZikahInfo(personId, sliceIndex);
    }
  }

  /**
   * Get zikah info for a yevama (widow).
   */
  private getYevamaZikahInfo(yevamaId: string, sliceIndex: number): ZikahInfo | null {
    const activeRecord = this.zikahRecords.find(
      (r) =>
        r.yevama === yevamaId &&
        r.createdAtSlice <= sliceIndex &&
        (r.status === 'shomeres-yavam' || r.status === 'after-maamar') &&
        (!r.resolvedAt || r.resolvedAt.sliceIndex > sliceIndex)
    );

    if (!activeRecord) {
      // Check for resolved zikah
      const resolvedRecord = this.zikahRecords.find(
        (r) =>
          r.yevama === yevamaId &&
          r.resolvedAt &&
          r.resolvedAt.sliceIndex <= sliceIndex
      );

      if (resolvedRecord) {
        return {
          isZakuk: false,
          status: resolvedRecord.status,
          originatingMarriage: resolvedRecord.marriageEdgeId,
          createdAtSlice: resolvedRecord.createdAtSlice,
          resolvedAtSlice: resolvedRecord.resolvedAt!.sliceIndex,
          resolution: resolvedRecord.resolution,
        };
      }

      return null;
    }

    // Filter for living yevamim at this slice
    const livingYevamim = activeRecord.yevamim.filter((yavamId) =>
      this.engine.isAlive(yavamId, sliceIndex)
    );

    return {
      isZakuk: true,
      zekukaTo: livingYevamim,
      status: activeRecord.status,
      originatingMarriage: activeRecord.marriageEdgeId,
      createdAtSlice: activeRecord.createdAtSlice,
      maamarEvent: activeRecord.maamarEvent,
    };
  }

  /**
   * Get zikah info for a yavam (brother).
   */
  private getYavamZikahInfo(yavamId: string, sliceIndex: number): ZikahInfo | null {
    const activeRecords = this.zikahRecords.filter(
      (r) =>
        r.yevamim.includes(yavamId) &&
        r.createdAtSlice <= sliceIndex &&
        (r.status === 'shomeres-yavam' || r.status === 'after-maamar') &&
        (!r.resolvedAt || r.resolvedAt.sliceIndex > sliceIndex)
    );

    if (activeRecords.length === 0) return null;

    // Get all yevamos this yavam is obligated to
    const yevamos = activeRecords.map((r) => r.yevama);

    return {
      isZakuk: true,
      zekukaTo: yevamos,
      status: 'shomeres-yavam', // Yavam status is simpler
      originatingMarriage: activeRecords[0].marriageEdgeId,
      createdAtSlice: activeRecords[0].createdAtSlice,
    };
  }

  /**
   * Check if there is an active zikah between two people.
   */
  hasActiveZikah(
    person1: string,
    person2: string,
    sliceIndex: number
  ): boolean {
    this.initialize();

    return this.zikahRecords.some(
      (r) =>
        r.createdAtSlice <= sliceIndex &&
        (r.status === 'shomeres-yavam' || r.status === 'after-maamar') &&
        (!r.resolvedAt || r.resolvedAt.sliceIndex > sliceIndex) &&
        ((r.yevama === person1 && r.yevamim.includes(person2)) ||
          (r.yevama === person2 && r.yevamim.includes(person1)))
    );
  }

  /**
   * Get all active zikah records at a slice.
   */
  getActiveZikahRecords(sliceIndex: number): ZikahRecord[] {
    this.initialize();

    return this.zikahRecords.filter(
      (r) =>
        r.createdAtSlice <= sliceIndex &&
        (r.status === 'shomeres-yavam' || r.status === 'after-maamar') &&
        (!r.resolvedAt || r.resolvedAt.sliceIndex > sliceIndex)
    );
  }

  /**
   * Get all yevamos (widows awaiting yibum) at a slice.
   */
  getYevamos(sliceIndex: number): string[] {
    const active = this.getActiveZikahRecords(sliceIndex);
    return [...new Set(active.map((r) => r.yevama))];
  }

  /**
   * Get all yevamim (brothers obligated in yibum) for a yevama at a slice.
   */
  getYevamimFor(yevamaId: string, sliceIndex: number): string[] {
    this.initialize();

    const record = this.zikahRecords.find(
      (r) =>
        r.yevama === yevamaId &&
        r.createdAtSlice <= sliceIndex &&
        (r.status === 'shomeres-yavam' || r.status === 'after-maamar') &&
        (!r.resolvedAt || r.resolvedAt.sliceIndex > sliceIndex)
    );

    if (!record) return [];

    // Filter for living yevamim
    return record.yevamim.filter((yavamId) =>
      this.engine.isAlive(yavamId, sliceIndex)
    );
  }

  /**
   * Check if a person is a yevama at a given slice.
   */
  isYevama(personId: string, sliceIndex: number): boolean {
    const info = this.getZikahInfo(personId, sliceIndex);
    return info?.isZakuk === true && info.status === 'shomeres-yavam';
  }

  /**
   * Check if a person is a yavam (has obligation) at a given slice.
   */
  isYavam(personId: string, sliceIndex: number): boolean {
    const person = this.graph.nodes[personId];
    if (!person || person.gender !== 'male') return false;

    const info = this.getZikahInfo(personId, sliceIndex);
    return info?.isZakuk === true;
  }

  /**
   * Get the zikah status between two specific people.
   */
  getZikahBetween(
    person1: string,
    person2: string,
    sliceIndex: number
  ): ZikahInfo | null {
    this.initialize();

    const record = this.zikahRecords.find(
      (r) =>
        r.createdAtSlice <= sliceIndex &&
        ((r.yevama === person1 && r.yevamim.includes(person2)) ||
          (r.yevama === person2 && r.yevamim.includes(person1)))
    );

    if (!record) return null;

    const isActive =
      (record.status === 'shomeres-yavam' || record.status === 'after-maamar') &&
      (!record.resolvedAt || record.resolvedAt.sliceIndex > sliceIndex);

    return {
      isZakuk: isActive,
      zekukaTo: record.yevamim,
      status: record.status,
      originatingMarriage: record.marriageEdgeId,
      createdAtSlice: record.createdAtSlice,
      resolvedAtSlice: record.resolvedAt?.sliceIndex,
      resolution: record.resolution,
      maamarEvent: record.maamarEvent,
    };
  }

  /**
   * Force re-initialization (call after graph changes).
   */
  refresh(): void {
    this.initialized = false;
    this.initialize();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Convenience Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a zikah tracker for a graph.
 */
export function createZikahTracker(graph: TemporalGraph): ZikahTracker {
  const tracker = new ZikahTracker(graph);
  tracker.initialize();
  return tracker;
}

/**
 * Quick check if zikah exists between two people.
 */
export function hasZikah(
  graph: TemporalGraph,
  person1: string,
  person2: string,
  sliceIndex: number
): boolean {
  const tracker = new ZikahTracker(graph);
  return tracker.hasActiveZikah(person1, person2, sliceIndex);
}
