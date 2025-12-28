/**
 * Halachic Overlay Component
 *
 * Renders status lines between the locked person and all others
 * when halacha mode is active. This is a Three.js component that
 * renders inside the Canvas.
 */

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useGraphStore } from '@/store/graphStore';
import { useHalachaStore } from '@/store/halachaStore';
import { StatusEngine } from '@/halacha/statusEngine';
import { StatusCategory } from '@/halacha/types';
import * as THREE from 'three';

interface StatusLineProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  opacity: number;
  lineWidth: number;
  dashed?: boolean;
}

function StatusLine({ start, end, color, opacity, lineWidth, dashed }: StatusLineProps) {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ], [start, end]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      opacity={opacity}
      transparent
      dashed={dashed}
      dashSize={dashed ? 0.3 : undefined}
      gapSize={dashed ? 0.15 : undefined}
    />
  );
}

interface HalachicOverlayProps {
  sliceSpacing: number;
}

export function HalachicOverlay({ sliceSpacing }: HalachicOverlayProps) {
  const enabled = useHalachaStore((state) => state.enabled);
  const lockedPersonId = useHalachaStore((state) => state.lockedPersonId);
  const hoveredPersonId = useHalachaStore((state) => state.hoveredPersonId);
  const opinionProfile = useHalachaStore((state) => state.opinionProfile);
  const registry = useHalachaStore((state) => state.registry);

  const graph = useGraphStore((state) => state.graph);
  const currentSliceIndex = useGraphStore((state) => state.currentSliceIndex);

  // Create status engine
  const statusEngine = useMemo(() => {
    if (!enabled || !lockedPersonId) return null;
    return new StatusEngine(graph, registry);
  }, [enabled, lockedPersonId, graph, registry]);

  // Compute all statuses from locked person
  const statusLines = useMemo(() => {
    if (!enabled || !lockedPersonId || !statusEngine) return [];

    // Get position from graph.nodes (not resolvedState which may not include all nodes)
    const lockedPerson = graph.nodes[lockedPersonId];
    if (!lockedPerson) return [];

    const lines: Array<{
      personId: string;
      start: [number, number, number];
      end: [number, number, number];
      category: StatusCategory | null;
      isHovered: boolean;
    }> = [];

    // Get position of locked person
    const lockedZ = currentSliceIndex * sliceSpacing;
    const lockedPos: [number, number, number] = [
      lockedPerson.position.x,
      lockedPerson.position.y + 0.5, // Slightly above node
      lockedZ,
    ];

    // Compute status to each other person
    const allStatuses = statusEngine.computeAllStatuses(
      lockedPersonId,
      currentSliceIndex,
      opinionProfile
    );

    for (const [otherId, status] of allStatuses) {
      // Get position from graph.nodes (not resolvedState which may not include all nodes)
      const otherPerson = graph.nodes[otherId];
      if (!otherPerson) continue;

      // Ervah and zikah only apply between opposite genders
      // Skip if same gender
      if (lockedPerson.gender === otherPerson.gender) continue;

      const otherPos: [number, number, number] = [
        otherPerson.position.x,
        otherPerson.position.y + 0.5,
        lockedZ, // Same slice
      ];

      // Get primary category
      const primaryCategory = status.primaryStatus
        ? registry.categories.find((c) => c.id === status.primaryStatus!.categoryId) || null
        : null;

      lines.push({
        personId: otherId,
        start: lockedPos,
        end: otherPos,
        category: primaryCategory,
        isHovered: otherId === hoveredPersonId,
      });
    }

    return lines;
  }, [
    enabled,
    lockedPersonId,
    statusEngine,
    graph.nodes,
    currentSliceIndex,
    sliceSpacing,
    opinionProfile,
    registry.categories,
    hoveredPersonId,
  ]);

  if (!enabled || !lockedPersonId) return null;

  return (
    <group name="halachic-overlay">
      {statusLines.map(({ personId, start, end, category, isHovered }) => {
        // Determine line style based on category
        const color = category?.color || '#22c55e'; // Green for mutar/permitted
        const opacity = isHovered ? 0.9 : 0.5;
        const lineWidth = isHovered ? 3 : 1.5;
        const dashed = category?.level === 'drabbanan' || category?.level === 'minhag';

        return (
          <StatusLine
            key={personId}
            start={start}
            end={end}
            color={color}
            opacity={opacity}
            lineWidth={lineWidth}
            dashed={dashed}
          />
        );
      })}

      {/* Highlight ring around locked person */}
      <LockedPersonHighlight
        personId={lockedPersonId}
        sliceSpacing={sliceSpacing}
        currentSliceIndex={currentSliceIndex}
      />
    </group>
  );
}

interface LockedPersonHighlightProps {
  personId: string;
  sliceSpacing: number;
  currentSliceIndex: number;
}

function LockedPersonHighlight({
  personId,
  sliceSpacing,
  currentSliceIndex,
}: LockedPersonHighlightProps) {
  const graph = useGraphStore((state) => state.graph);
  const person = graph.nodes[personId];

  if (!person) return null;

  const z = currentSliceIndex * sliceSpacing;

  return (
    <mesh position={[person.position.x, person.position.y, z]}>
      <ringGeometry args={[0.8, 1.0, 32]} />
      <meshBasicMaterial
        color="#a855f7"
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
