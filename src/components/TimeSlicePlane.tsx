import { useMemo, useState } from 'react';
import { Text, Line, RoundedBox } from '@react-three/drei';
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
  const openEditDescription = useGraphStore((state) => state.openEditDescription);
  const currentSliceIndex = useGraphStore((state) => state.currentSliceIndex);
  const clearNodeSelection = useGraphStore((state) => state.clearNodeSelection);
  const viewMode = useGraphStore((state) => state.viewMode);
  const isDraggingNode = useGraphStore((state) => state.isDraggingNode);

  // State for tab and label hover
  const [tabHovered, setTabHovered] = useState(false);
  const [labelHovered, setLabelHovered] = useState(false);

  // Calculate opacity - non-current slices are much dimmer
  const planeOpacity = useMemo(() => {
    if (isCurrentSlice) return 0.15;
    return 0.02; // Much dimmer for non-current slices
  }, [isCurrentSlice]);

  // Border color also adjusts in Focus mode
  const borderColor = useMemo(() => {
    if (isCurrentSlice) return '#22d3ee';
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
    // Only allow clicks on the current slice
    if (!isCurrentSlice) return;

    // Don't change slice if we're currently dragging a node
    if (isDraggingNode) return;

    // Clear any node selection when clicking on the slice background
    clearNodeSelection();
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    // Only allow context menu on current slice
    if (!isCurrentSlice) return;

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

  const handleTabClick = () => {
    setCurrentSlice(sliceIndex);
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
          color={isCurrentSlice ? '#22d3ee' : '#151922'}
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

      {/* Folder tab on top-left edge - staggered position, always clickable */}
      <group position={[-17, 14 - (sliceIndex * 1.8), 0]}>
        <RoundedBox
          args={[1.6, 0.9, 0.08]}
          radius={0.08}
          smoothness={4}
          onClick={handleTabClick}
          onPointerOver={() => {
            setTabHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setTabHovered(false);
            document.body.style.cursor = 'auto';
          }}
        >
          <meshStandardMaterial
            color={isCurrentSlice ? '#1e293b' : (tabHovered ? '#1e293b' : '#151922')}
            emissive={isCurrentSlice ? '#22d3ee' : '#000000'}
            emissiveIntensity={isCurrentSlice ? 0.15 : 0}
            transparent
            opacity={isCurrentSlice ? 0.95 : (tabHovered ? 0.8 : 0.6)}
          />
        </RoundedBox>
        <Text
          position={[0, 0, 0.06]}
          fontSize={0.32}
          color={isCurrentSlice ? '#22d3ee' : (tabHovered ? '#94a3b8' : '#64748b')}
          anchorX="center"
          anchorY="middle"
        >
          t={sliceIndex}
        </Text>
      </group>

      {/* Slice description bar - bottom center with background */}
      <group position={[0, -15.5, 0.05]}>
        {/* Background bar */}
        <RoundedBox
          args={[20, 1.4, 0.1]}
          radius={0.15}
          smoothness={4}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (isCurrentSlice) {
              e.stopPropagation();
              openEditDescription(sliceIndex);
            }
          }}
          onPointerOver={() => {
            if (isCurrentSlice) {
              setLabelHovered(true);
              document.body.style.cursor = 'pointer';
            }
          }}
          onPointerOut={() => {
            setLabelHovered(false);
            document.body.style.cursor = 'auto';
          }}
        >
          <meshStandardMaterial
            color={isCurrentSlice ? (labelHovered ? '#1e293b' : '#0f172a') : '#0a0d12'}
            transparent
            opacity={isCurrentSlice ? 0.95 : 0.15}
          />
        </RoundedBox>
        {/* Border outline */}
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[20.1, 1.5]} />
          <meshBasicMaterial
            color={isCurrentSlice ? '#334155' : '#1e293b'}
            transparent
            opacity={isCurrentSlice ? 0.8 : 0.15}
          />
        </mesh>
        <RoundedBox
          args={[20, 1.4, 0.12]}
          radius={0.15}
          smoothness={4}
          position={[0, 0, -0.02]}
        >
          <meshBasicMaterial
            color={isCurrentSlice ? '#334155' : '#1e293b'}
            transparent
            opacity={isCurrentSlice ? 1 : 0.15}
          />
        </RoundedBox>
        {/* Description text */}
        <Text
          position={[0, 0, 0.1]}
          fontSize={0.5}
          color={
            slice.label
              ? (isCurrentSlice ? (labelHovered ? '#67e8f9' : '#e8e6e3') : '#3f4654')
              : (isCurrentSlice ? (labelHovered ? '#67e8f9' : '#64748b') : '#2a2f3a')
          }
          anchorX="center"
          anchorY="middle"
          maxWidth={18}
        >
          {slice.label || 'Description...'}
        </Text>
      </group>

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

          // Check if this is a relationship type that can have children
          const hasChildren = edge.childIds && edge.childIds.length > 0;
          const canHaveChildren = edge.type === 'erusin' || edge.type === 'nisuin' || edge.type === 'divorce' || edge.type === 'unmarried-relations';
          if (hasChildren && canHaveChildren) {
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
