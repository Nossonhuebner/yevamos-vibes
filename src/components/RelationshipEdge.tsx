import { useMemo, useState, useEffect, useRef } from 'react';
import { Line, Text } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Relationship, RELATIONSHIP_STYLES, RELATIONSHIP_LABELS } from '@/types';
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

  const [isHovered, setIsHovered] = useState(false);
  const [labelOpacity, setLabelOpacity] = useState(0);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetOpacity = useRef(0);

  const isSelected = selectedEdgeId === edge.id;

  // Animate label opacity
  useFrame((_, delta) => {
    const speed = 4; // Animation speed
    if (labelOpacity < targetOpacity.current) {
      setLabelOpacity(Math.min(labelOpacity + delta * speed, targetOpacity.current));
    } else if (labelOpacity > targetOpacity.current) {
      setLabelOpacity(Math.max(labelOpacity - delta * speed, targetOpacity.current));
    }
  });

  // Handle hover with delay for fade-in
  useEffect(() => {
    if (isHovered || isSelected) {
      // Delay before starting fade-in
      hoverTimeoutRef.current = setTimeout(() => {
        targetOpacity.current = 1;
      }, 150); // 150ms delay
    } else {
      // Clear any pending timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      // Start fade-out immediately
      targetOpacity.current = 0;
    }
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [isHovered, isSelected]);
  const isCurrentSlice = sliceIndex === currentSliceIndex;
  const style = RELATIONSHIP_STYLES[edge.type] ?? { color: '#94a3b8', lineStyle: 'solid' as const, lineWidth: 2 };
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

  // Fade edges involving dead people or non-current slices
  const color = isSelected ? '#fbbf24' : (isInvolvingDeadPerson ? '#6b7280' : style.color);
  const opacity = isInvolvingDeadPerson ? 0.12 : (isCurrentSlice ? 1 : 0.25);
  const shadowOpacity = isCurrentSlice ? 0.25 : 0.03;

  // Shadow line points (offset for depth effect)
  const shadowPoints = useMemo(() => {
    const offset = 0.04;
    return [
      new THREE.Vector3(sourcePosition.x + offset, sourcePosition.y - offset, 0.01),
      new THREE.Vector3(targetPosition.x + offset, targetPosition.y - offset, 0.01),
    ];
  }, [sourcePosition, targetPosition]);

  // Check if this is a parent-child edge
  const isParentChild = edge.type === 'parent-child';
  const parentChildLineWidth = 3 * (isSelected ? 1.5 : 1); // Wider lines for parent-child

  // Check if this is a nisuin or divorce edge
  const isNisuin = edge.type === 'nisuin';
  const isDivorce = edge.type === 'divorce';
  // Divorce only shows blue sandwich if it was from nisuin
  const showSandwich = isNisuin || (isDivorce && edge.divorceFromNisuin);

  // Calculate straight line points for parent-child edges (with arrow)
  const parentChildPoints = useMemo(() => {
    if (!isParentChild) return null;

    const start = new THREE.Vector3(sourcePosition.x, sourcePosition.y, 0.05);
    const end = new THREE.Vector3(targetPosition.x, targetPosition.y + 0.5, 0.05); // Stop above child for arrow

    return { start, end, targetX: targetPosition.x, targetY: targetPosition.y + 0.5 };
  }, [sourcePosition, targetPosition, isParentChild]);

  // Calculate sandwich lines for nisuin (light blue border padding around pink)
  const nisuinSandwichPoints = useMemo(() => {
    if (!showSandwich) return null;

    const start = new THREE.Vector3(sourcePosition.x, sourcePosition.y, 0.05);
    const end = new THREE.Vector3(targetPosition.x, targetPosition.y, 0.05);

    // Calculate perpendicular offset - tighter for border effect
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const offset = 0.035; // Tight padding
    const perpX = -dy / len * offset;
    const perpY = dx / len * offset;

    return {
      outer1Start: new THREE.Vector3(start.x + perpX, start.y + perpY, 0.04),
      outer1End: new THREE.Vector3(end.x + perpX, end.y + perpY, 0.04),
      outer2Start: new THREE.Vector3(start.x - perpX, start.y - perpY, 0.04),
      outer2End: new THREE.Vector3(end.x - perpX, end.y - perpY, 0.04),
    };
  }, [sourcePosition, targetPosition, showSandwich]);

  return (
    <group>
      {/* Invisible click area for edge interaction */}
      <mesh
        position={[edgeGeometry.centerX, edgeGeometry.centerY, 0.05]}
        rotation={[0, 0, edgeGeometry.angle]}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onPointerOver={() => {
          if (canInteract) {
            setIsHovered(true);
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={() => {
          setIsHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <planeGeometry args={[edgeGeometry.length, 0.4]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Shadow line for depth effect */}
      {!isParentChild && (
        <Line
          points={shadowPoints}
          color="#000000"
          lineWidth={style.lineWidth + 2}
          transparent
          opacity={shadowOpacity}
        />
      )}

      {/* Render straight line for parent-child (with arrow), or regular line for others */}
      {isParentChild && parentChildPoints ? (
        <group>
          {/* Shadow for parent-child line */}
          <Line
            points={[
              new THREE.Vector3(parentChildPoints.start.x + 0.03, parentChildPoints.start.y - 0.03, 0.01),
              new THREE.Vector3(parentChildPoints.end.x + 0.03, parentChildPoints.end.y - 0.03, 0.01),
            ]}
            color="#000000"
            lineWidth={parentChildLineWidth + 1}
            transparent
            opacity={shadowOpacity}
          />
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
            <coneGeometry args={[0.08, 0.12, 8]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
          </mesh>
        </group>
      ) : (
        <group>
          {/* For nisuin or divorce-from-nisuin: render light blue border lines on sides */}
          {showSandwich && nisuinSandwichPoints && (
            <>
              <Line
                points={[nisuinSandwichPoints.outer1Start, nisuinSandwichPoints.outer1End]}
                color={isSelected ? '#fbbf24' : (isInvolvingDeadPerson ? '#6b7280' : '#7dd3fc')}
                lineWidth={2 * (isSelected ? 1.5 : 1)}
                transparent
                opacity={opacity}
                dashed={isDivorce}
                dashSize={isDivorce ? 0.15 : undefined}
                gapSize={isDivorce ? 0.08 : undefined}
              />
              <Line
                points={[nisuinSandwichPoints.outer2Start, nisuinSandwichPoints.outer2End]}
                color={isSelected ? '#fbbf24' : (isInvolvingDeadPerson ? '#6b7280' : '#7dd3fc')}
                lineWidth={2 * (isSelected ? 1.5 : 1)}
                transparent
                opacity={opacity}
                dashed={isDivorce}
                dashSize={isDivorce ? 0.15 : undefined}
                gapSize={isDivorce ? 0.08 : undefined}
              />
            </>
          )}
          {/* Main line (pink for erusin/nisuin/divorce, or styled for others) */}
          <Line
            points={points}
            color={isSelected ? '#fbbf24' : (isInvolvingDeadPerson ? '#6b7280' : (isDivorce ? '#f472b6' : style.color))}
            lineWidth={style.lineWidth * (isSelected ? 1.5 : 1)}
            transparent
            opacity={opacity}
            dashed={isDivorce || style.lineStyle === 'dashed'}
            dashSize={0.15}
            gapSize={0.08}
          />
        </group>
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

      {/* Relationship type label on hover/selection - with fade animation */}
      {labelOpacity > 0 && isCurrentSlice && (
        <group position={[midpoint.x, midpoint.y + 0.35, midpoint.z]}>
          {/* Dark rounded background pill */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.0, 0.28]} />
            <meshBasicMaterial color="#1e293b" transparent opacity={0.95 * labelOpacity} />
          </mesh>
          {/* Subtle border */}
          <mesh position={[0, 0, -0.02]}>
            <planeGeometry args={[1.06, 0.34]} />
            <meshBasicMaterial color={isDivorce ? '#f472b6' : style.color} transparent opacity={0.4 * labelOpacity} />
          </mesh>
          {/* Label text */}
          <Text
            fontSize={0.13}
            color={isSelected ? '#fbbf24' : '#f8fafc'}
            anchorX="center"
            anchorY="middle"
            fillOpacity={labelOpacity}
          >
            {RELATIONSHIP_LABELS[edge.type]}
          </Text>
        </group>
      )}
    </group>
  );
}
