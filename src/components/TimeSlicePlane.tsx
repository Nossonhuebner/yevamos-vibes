import { useMemo } from 'react';
import { Text, Line } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ResolvedGraphState, TimeSlice, Person } from '@/types';
import { getNodesArray, getEdgesArray, isPersonDead } from '@/utils/deltaResolver';
import { PersonNode } from './PersonNode';
import { RelationshipEdge } from './RelationshipEdge';
import { MarriageWithChildren } from './MarriageWithChildren';
import { useGraphStore } from '@/store/graphStore';

interface TimeSlicePlaneProps {
  slice: TimeSlice;
  sliceIndex: number;
  resolvedState: ResolvedGraphState | undefined;
  zPosition: number;
  isCurrentSlice: boolean;
}

export function TimeSlicePlane({
  slice,
  sliceIndex,
  resolvedState,
  zPosition,
  isCurrentSlice,
}: TimeSlicePlaneProps) {
  const setCurrentSlice = useGraphStore((state) => state.setCurrentSlice);
  const openContextMenu = useGraphStore((state) => state.openContextMenu);
  const currentSliceIndex = useGraphStore((state) => state.currentSliceIndex);
  const clearNodeSelection = useGraphStore((state) => state.clearNodeSelection);
  const viewMode = useGraphStore((state) => state.viewMode);
  const isDraggingNode = useGraphStore((state) => state.isDraggingNode);

  // Calculate opacity based on view mode and distance from current slice
  const planeOpacity = useMemo(() => {
    if (viewMode === 'overview') {
      // Overview mode: current slice slightly highlighted
      return isCurrentSlice ? 0.15 : 0.08;
    }
    // Focus mode: current slice more visible, others dim based on distance
    if (isCurrentSlice) return 0.2;
    const distance = Math.abs(sliceIndex - currentSliceIndex);
    return Math.max(0.02, 0.1 - distance * 0.02);
  }, [viewMode, isCurrentSlice, sliceIndex, currentSliceIndex]);

  // Border color also adjusts in Focus mode
  const borderColor = useMemo(() => {
    if (isCurrentSlice) return '#7c9885';
    if (viewMode === 'focus') {
      const distance = Math.abs(sliceIndex - currentSliceIndex);
      // Fade border color based on distance
      const alpha = Math.max(0.2, 1 - distance * 0.2);
      return `rgba(42, 47, 58, ${alpha})`;
    }
    return '#2a2f3a';
  }, [viewMode, isCurrentSlice, sliceIndex, currentSliceIndex]);

  // Create border points for the vertical plane (XY plane) - doubled size
  const borderPoints = useMemo(() => {
    const size = 16;
    return [
      new THREE.Vector3(-size, -size, 0),
      new THREE.Vector3(size, -size, 0),
      new THREE.Vector3(size, size, 0),
      new THREE.Vector3(-size, size, 0),
      new THREE.Vector3(-size, -size, 0),
    ];
  }, []);

  if (!resolvedState) return null;

  const nodes = getNodesArray(resolvedState);
  const edges = getEdgesArray(resolvedState);

  const handlePlaneClick = () => {
    // Don't change slice if we're currently dragging a node
    // (the click event can fire when releasing the mouse after a drag)
    if (isDraggingNode) return;

    setCurrentSlice(sliceIndex);
    // Clear any node selection when clicking on the slice background
    clearNodeSelection();
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    // Only allow context menu on current slice
    if (sliceIndex !== currentSliceIndex) {
      setCurrentSlice(sliceIndex);
      return;
    }

    e.stopPropagation();
    e.nativeEvent.preventDefault();

    // Get the 3D position on the plane (local to the group)
    const position3D = { x: e.point.x, y: e.point.y };

    openContextMenu(
      { type: 'slice', sliceIndex, position3D },
      e.nativeEvent.clientX,
      e.nativeEvent.clientY
    );
  };

  return (
    <group position={[0, 0, zPosition]}>
      {/* Slice plane (semi-transparent) - vertical XY plane - doubled size */}
      <mesh
        position={[0, 0, 0]}
        onClick={handlePlaneClick}
        onContextMenu={handleContextMenu}
      >
        <planeGeometry args={[32, 32]} />
        <meshStandardMaterial
          color={isCurrentSlice ? '#7c9885' : '#151922'}
          transparent
          opacity={planeOpacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Plane border */}
      <Line
        points={borderPoints}
        color={borderColor}
        lineWidth={1}
      />

      {/* Time index - top right */}
      <Text
        position={[15.5, 15.5, 0.1]}
        fontSize={0.5}
        color={isCurrentSlice ? '#7c9885' : '#5a5a5a'}
        anchorX="right"
      >
        t={sliceIndex}
      </Text>

      {/* Slice label - bottom center */}
      {slice.label && (
        <Text
          position={[0, -15, 0.1]}
          fontSize={0.6}
          color={isCurrentSlice ? '#e8e6e3' : '#5a5a5a'}
          anchorX="center"
          anchorY="top"
          maxWidth={30}
        >
          {slice.label}
        </Text>
      )}

      {/* Render edges first (so they appear behind nodes) */}
      {(() => {
        // Group edges by their node pair to detect multiple relationships between same people
        const edgePairMap = new Map<string, typeof edges>();
        edges.forEach((edge) => {
          if (edge.hidden) return;
          // Create a normalized key (alphabetically sorted IDs)
          const pairKey = [edge.sourceId, edge.targetId].sort().join('-');
          if (!edgePairMap.has(pairKey)) {
            edgePairMap.set(pairKey, []);
          }
          edgePairMap.get(pairKey)!.push(edge);
        });

        return edges.map((edge) => {
          // Skip hidden edges (they're rendered as part of MarriageWithChildren)
          if (edge.hidden) return null;

          const sourceNode = resolvedState.nodes.get(edge.sourceId);
          const targetNode = resolvedState.nodes.get(edge.targetId);
          if (!sourceNode || !targetNode) return null;

          // Calculate stagger offset for multiple relationships between same people
          const pairKey = [edge.sourceId, edge.targetId].sort().join('-');
          const pairEdges = edgePairMap.get(pairKey) || [];
          const edgeIndex = pairEdges.indexOf(edge);
          const totalEdges = pairEdges.length;
          // Offset in Y direction (oldest on top = highest Y)
          const staggerOffset = totalEdges > 1 ? (totalEdges - 1 - edgeIndex) * 0.3 : 0;

          // Check if either person is dead
          const isInvolvingDeadPerson =
            isPersonDead(sourceNode, sliceIndex) || isPersonDead(targetNode, sliceIndex);

          // Check if this is a marriage/unmarried-relations with children
          const hasChildren = edge.childIds && edge.childIds.length > 0;
          if (hasChildren && (edge.type === 'marriage' || edge.type === 'unmarried-relations')) {
            // Gather child nodes
            const childNodes: Person[] = edge.childIds!
              .map(id => resolvedState.nodes.get(id))
              .filter((n): n is Person => n !== undefined);

            return (
              <MarriageWithChildren
                key={edge.id}
                edge={edge}
                sourcePosition={{ x: sourceNode.position.x, y: sourceNode.position.y + staggerOffset }}
                targetPosition={{ x: targetNode.position.x, y: targetNode.position.y + staggerOffset }}
                children={childNodes}
                sliceIndex={sliceIndex}
                isInvolvingDeadPerson={isInvolvingDeadPerson}
              />
            );
          }

          return (
            <RelationshipEdge
              key={edge.id}
              edge={edge}
              sourcePosition={{ x: sourceNode.position.x, y: sourceNode.position.y + staggerOffset }}
              targetPosition={{ x: targetNode.position.x, y: targetNode.position.y + staggerOffset }}
              sliceIndex={sliceIndex}
              isInvolvingDeadPerson={isInvolvingDeadPerson}
            />
          );
        });
      })()}

      {/* Render nodes */}
      {nodes.map((node) => (
        <PersonNode
          key={node.id}
          person={node}
          sliceIndex={sliceIndex}
          isCurrentSlice={isCurrentSlice}
        />
      ))}

    </group>
  );
}
