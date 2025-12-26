import { useMemo } from 'react';
import { Line, Text } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Relationship, RELATIONSHIP_STYLES } from '@/types';
import { useGraphStore } from '@/store/graphStore';

interface RelationshipEdgeProps {
  edge: Relationship;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  sliceIndex: number;
  isInvolvingDeadPerson?: boolean; // True if either source or target is dead
}

export function RelationshipEdge({
  edge,
  sourcePosition,
  targetPosition,
  sliceIndex,
  isInvolvingDeadPerson = false,
}: RelationshipEdgeProps) {
  const selectedEdgeId = useGraphStore((state) => state.selectedEdgeId);
  const selectEdge = useGraphStore((state) => state.selectEdge);
  const currentSliceIndex = useGraphStore((state) => state.currentSliceIndex);
  const openContextMenu = useGraphStore((state) => state.openContextMenu);

  const isSelected = selectedEdgeId === edge.id;
  const isCurrentSlice = sliceIndex === currentSliceIndex;
  const style = RELATIONSHIP_STYLES[edge.type];
  const canInteract = isCurrentSlice;

  // Calculate edge points on vertical XY plane
  const points = useMemo(() => {
    const start = new THREE.Vector3(sourcePosition.x, sourcePosition.y, 0.05);
    const end = new THREE.Vector3(targetPosition.x, targetPosition.y, 0.05);

    // For dashed lines, we need intermediate points
    if (style.lineStyle === 'dashed' || style.lineStyle === 'dotted') {
      const numSegments = style.lineStyle === 'dotted' ? 20 : 10;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments;
        pts.push(new THREE.Vector3(
          start.x + (end.x - start.x) * t,
          start.y + (end.y - start.y) * t,
          start.z + (end.z - start.z) * t
        ));
      }
      return pts;
    }

    return [start, end];
  }, [sourcePosition, targetPosition, style.lineStyle]);

  // Calculate midpoint for label
  const midpoint = useMemo(() => {
    return new THREE.Vector3(
      (sourcePosition.x + targetPosition.x) / 2,
      (sourcePosition.y + targetPosition.y) / 2,
      0.15
    );
  }, [sourcePosition, targetPosition]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (canInteract) {
      selectEdge(isSelected ? null : edge.id);
    }
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    if (!canInteract) return;

    e.stopPropagation();
    e.nativeEvent.preventDefault();

    openContextMenu(
      { type: 'edge', edgeId: edge.id },
      e.nativeEvent.clientX,
      e.nativeEvent.clientY
    );
  };

  // Calculate edge center and rotation for click area
  const edgeGeometry = useMemo(() => {
    const dx = targetPosition.x - sourcePosition.x;
    const dy = targetPosition.y - sourcePosition.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const centerX = (sourcePosition.x + targetPosition.x) / 2;
    const centerY = (sourcePosition.y + targetPosition.y) / 2;
    return { length, angle, centerX, centerY };
  }, [sourcePosition, targetPosition]);

  // Fade edges involving dead people
  const color = isSelected ? '#fbbf24' : (isInvolvingDeadPerson ? '#6b7280' : style.color);
  const opacity = isInvolvingDeadPerson ? 0.2 : (isCurrentSlice ? 1 : 0.4);

  // Check if this is a parent-child edge
  const isParentChild = edge.type === 'parent-child';
  const parentChildLineWidth = 3 * (isSelected ? 1.5 : 1); // Wider lines for parent-child

  // Calculate straight line points for parent-child edges (with arrow)
  const parentChildPoints = useMemo(() => {
    if (!isParentChild) return null;

    const start = new THREE.Vector3(sourcePosition.x, sourcePosition.y, 0.05);
    const end = new THREE.Vector3(targetPosition.x, targetPosition.y + 0.5, 0.05); // Stop above child for arrow

    return { start, end, targetX: targetPosition.x, targetY: targetPosition.y + 0.5 };
  }, [sourcePosition, targetPosition, isParentChild]);

  return (
    <group>
      {/* Invisible click area for edge interaction */}
      <mesh
        position={[edgeGeometry.centerX, edgeGeometry.centerY, 0.05]}
        rotation={[0, 0, edgeGeometry.angle]}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <planeGeometry args={[edgeGeometry.length, 0.3]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Render straight line for parent-child (with arrow), or regular line for others */}
      {isParentChild && parentChildPoints ? (
        <group>
          <Line
            points={[parentChildPoints.start, parentChildPoints.end]}
            color={color}
            lineWidth={parentChildLineWidth}
            transparent
            opacity={opacity}
          />
          {/* Arrow head pointing down at child */}
          <mesh
            position={[parentChildPoints.targetX, parentChildPoints.targetY - 0.08, 0.06]}
            rotation={[0, 0, Math.PI]} // Point downward
          >
            <coneGeometry args={[0.1, 0.15, 8]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
          </mesh>
        </group>
      ) : (
        <Line
          points={points}
          color={color}
          lineWidth={style.lineWidth * (isSelected ? 1.5 : 1)}
          transparent
          opacity={opacity}
          dashed={style.lineStyle === 'dashed'}
          dashSize={style.lineStyle === 'dashed' ? 0.2 : undefined}
          gapSize={style.lineStyle === 'dashed' ? 0.1 : undefined}
        />
      )}

      {/* Edge label (if provided) */}
      {edge.label && (
        <Text
          position={midpoint}
          fontSize={0.15}
          color={isCurrentSlice ? '#94a3b8' : '#475569'}
          anchorX="center"
          anchorY="middle"
        >
          {edge.label}
        </Text>
      )}

      {/* Relationship type indicator on hover/selection */}
      {isSelected && (
        <Text
          position={[midpoint.x, midpoint.y + 0.2, midpoint.z]}
          fontSize={0.12}
          color="#fbbf24"
          anchorX="center"
        >
          {edge.type}
        </Text>
      )}
    </group>
  );
}
