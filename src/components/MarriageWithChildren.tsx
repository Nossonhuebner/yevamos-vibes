import { useMemo, useState, useEffect, useRef } from 'react';
import { Line, Text } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Relationship, RELATIONSHIP_STYLES, RELATIONSHIP_LABELS, Person } from '@/types';
import { useGraphStore } from '@/store/graphStore';

interface MarriageWithChildrenProps {
  edge: Relationship;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  children: Person[];
  sliceIndex: number;
  isInvolvingDeadPerson?: boolean;
}

/**
 * Renders a marriage/relationship with children in T-shape layout:
 *
 * Parent1 ─────●───── Parent2    (horizontal marriage line with midpoint)
 *              │
 *              │                  (vertical drop line)
 *       ┌──────┴──────┐           (horizontal bar)
 *       ↓      ↓      ↓           (curved lines to children)
 *    Child1  Child2  Child3
 */
export function MarriageWithChildren({
  edge,
  sourcePosition,
  targetPosition,
  children,
  sliceIndex,
  isInvolvingDeadPerson = false,
}: MarriageWithChildrenProps) {
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
  const style = RELATIONSHIP_STYLES[edge.type];
  const canInteract = isCurrentSlice;

  const isNisuin = edge.type === 'nisuin';
  const isDivorce = edge.type === 'divorce';
  const mainColor = isDivorce ? '#f472b6' : style.color; // Divorce uses pink like marriage
  const color = isSelected ? '#fbbf24' : (isInvolvingDeadPerson ? '#6b7280' : mainColor);
  const sandwichColor = isSelected ? '#fbbf24' : (isInvolvingDeadPerson ? '#6b7280' : '#7dd3fc'); // Light blue
  const opacity = isInvolvingDeadPerson ? 0.12 : (isCurrentSlice ? 1 : 0.25);
  const shadowOpacity = isCurrentSlice ? 0.25 : 0.03;
  const lineWidth = style.lineWidth * (isSelected ? 1.5 : 1);
  const childLineWidth = 2.5 * (isSelected ? 1.5 : 1); // Lines for child connections
  // Only show blue sandwich for nisuin or divorce-from-nisuin
  const showSandwich = isNisuin || (isDivorce && edge.divorceFromNisuin);

  // Calculate T-shape geometry
  const tShape = useMemo(() => {
    // Midpoint between parents (where the T descends from)
    const midX = (sourcePosition.x + targetPosition.x) / 2;
    const midY = (sourcePosition.y + targetPosition.y) / 2;

    // Horizontal marriage line points
    const marriageStart = new THREE.Vector3(sourcePosition.x, sourcePosition.y, 0.05);
    const marriageEnd = new THREE.Vector3(targetPosition.x, targetPosition.y, 0.05);
    const marriageMid = new THREE.Vector3(midX, midY, 0.05);

    // If no children, just return the marriage line
    if (children.length === 0) {
      return {
        marriageStart,
        marriageEnd,
        marriageMid,
        verticalDrop: null,
        horizontalBar: null,
        childConnections: [],
      };
    }

    // Sort children by x position for consistent rendering
    const sortedChildren = [...children].sort((a, b) => a.position.x - b.position.x);

    // Find the child Y level (highest child Y position - closest to parents)
    const childY = Math.max(...children.map(c => c.position.y));

    // Calculate where lines connect to children (top of circular node)
    const nodeRadius = 0.45;
    const connectionY = childY + nodeRadius + 0.15; // Just above the node

    // For multiple children, we need a horizontal distribution bar
    const isSingleChild = sortedChildren.length === 1;

    // Bar height - positioned between parents and children
    const barY = midY - (midY - connectionY) * 0.4;

    // Vertical drop from midpoint to bar
    const dropStart = new THREE.Vector3(midX, midY, 0.05);
    const dropEnd = new THREE.Vector3(midX, barY, 0.05);

    // Horizontal bar spanning all children
    const leftMost = sortedChildren[0].position.x;
    const rightMost = sortedChildren[sortedChildren.length - 1].position.x;
    const barStart = new THREE.Vector3(leftMost, barY, 0.05);
    const barEnd = new THREE.Vector3(rightMost, barY, 0.05);

    // Connections from bar to each child
    const childConnections = sortedChildren.map((child) => {
      const startX = isSingleChild ? midX : child.position.x;
      const startY = isSingleChild ? midY : barY;
      const endY = child.position.y + nodeRadius + 0.12;

      const start = new THREE.Vector3(startX, startY, 0.05);
      const end = new THREE.Vector3(child.position.x, endY, 0.05);

      return { start, end, childX: child.position.x, childY: endY };
    });

    // Only show vertical drop and horizontal bar for multiple children
    const showDropAndBar = !isSingleChild;

    return {
      marriageStart,
      marriageEnd,
      marriageMid,
      verticalDrop: showDropAndBar ? { start: dropStart, end: dropEnd } : null,
      horizontalBar: showDropAndBar ? { start: barStart, end: barEnd } : null,
      childConnections,
    };
  }, [sourcePosition, targetPosition, children]);

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

  // Calculate click area for the marriage line
  const clickAreaGeometry = useMemo(() => {
    const dx = targetPosition.x - sourcePosition.x;
    const dy = targetPosition.y - sourcePosition.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const centerX = (sourcePosition.x + targetPosition.x) / 2;
    const centerY = (sourcePosition.y + targetPosition.y) / 2;
    return { length, angle, centerX, centerY };
  }, [sourcePosition, targetPosition]);

  // Calculate sandwich lines for nisuin/divorce (light blue border padding around pink)
  const sandwichPoints = useMemo(() => {
    if (!showSandwich) return null;

    const dx = targetPosition.x - sourcePosition.x;
    const dy = targetPosition.y - sourcePosition.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const offset = 0.035; // Tight padding
    const perpX = -dy / len * offset;
    const perpY = dx / len * offset;

    return {
      outer1Start: new THREE.Vector3(sourcePosition.x + perpX, sourcePosition.y + perpY, 0.04),
      outer1End: new THREE.Vector3(targetPosition.x + perpX, targetPosition.y + perpY, 0.04),
      outer2Start: new THREE.Vector3(sourcePosition.x - perpX, sourcePosition.y - perpY, 0.04),
      outer2End: new THREE.Vector3(targetPosition.x - perpX, targetPosition.y - perpY, 0.04),
    };
  }, [sourcePosition, targetPosition, showSandwich]);

  return (
    <group>
      {/* Invisible click area for the marriage line */}
      <mesh
        position={[clickAreaGeometry.centerX, clickAreaGeometry.centerY, 0.05]}
        rotation={[0, 0, clickAreaGeometry.angle]}
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
        <planeGeometry args={[clickAreaGeometry.length, 0.3]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Shadow line for depth effect */}
      <Line
        points={[
          new THREE.Vector3(tShape.marriageStart.x + 0.04, tShape.marriageStart.y - 0.04, 0.01),
          new THREE.Vector3(tShape.marriageEnd.x + 0.04, tShape.marriageEnd.y - 0.04, 0.01),
        ]}
        color="#000000"
        lineWidth={lineWidth + 2}
        transparent
        opacity={shadowOpacity}
      />

      {/* For nisuin/divorce: render light blue border lines on sides */}
      {showSandwich && sandwichPoints && (
        <>
          <Line
            points={[sandwichPoints.outer1Start, sandwichPoints.outer1End]}
            color={sandwichColor}
            lineWidth={2 * (isSelected ? 1.5 : 1)}
            transparent
            opacity={opacity}
            dashed={isDivorce}
            dashSize={isDivorce ? 0.15 : undefined}
            gapSize={isDivorce ? 0.08 : undefined}
          />
          <Line
            points={[sandwichPoints.outer2Start, sandwichPoints.outer2End]}
            color={sandwichColor}
            lineWidth={2 * (isSelected ? 1.5 : 1)}
            transparent
            opacity={opacity}
            dashed={isDivorce}
            dashSize={isDivorce ? 0.15 : undefined}
            gapSize={isDivorce ? 0.08 : undefined}
          />
        </>
      )}

      {/* Marriage line (horizontal between parents) */}
      <Line
        points={[tShape.marriageStart, tShape.marriageEnd]}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
        dashed={isDivorce}
        dashSize={isDivorce ? 0.15 : undefined}
        gapSize={isDivorce ? 0.08 : undefined}
      />

      {/* Midpoint indicator */}
      {children.length > 0 && (
        <mesh position={[tShape.marriageMid.x, tShape.marriageMid.y, 0.06]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
      )}

      {/* Vertical drop line from midpoint to children bar */}
      {tShape.verticalDrop && (
        <Line
          points={[tShape.verticalDrop.start, tShape.verticalDrop.end]}
          color={color}
          lineWidth={lineWidth}
          transparent
          opacity={opacity}
        />
      )}

      {/* Horizontal bar above children (only if multiple children) */}
      {tShape.horizontalBar && (
        <Line
          points={[tShape.horizontalBar.start, tShape.horizontalBar.end]}
          color={color}
          lineWidth={lineWidth}
          transparent
          opacity={opacity}
        />
      )}

      {/* Lines to each child with small arrow indicators */}
      {tShape.childConnections.map((conn, index) => (
        <group key={index}>
          <Line
            points={[conn.start, conn.end]}
            color={color}
            lineWidth={childLineWidth}
            transparent
            opacity={opacity}
          />
          {/* Small arrow head pointing down at child */}
          <mesh
            position={[conn.childX, conn.childY - 0.04, 0.06]}
            rotation={[0, 0, Math.PI]} // Point downward
          >
            <coneGeometry args={[0.06, 0.1, 6]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
          </mesh>
        </group>
      ))}

      {/* Relationship type label on hover/selection - with fade animation */}
      {labelOpacity > 0 && isCurrentSlice && (
        <group position={[tShape.marriageMid.x, tShape.marriageMid.y + 0.35, 0.15]}>
          {/* Dark rounded background pill */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.0, 0.28]} />
            <meshBasicMaterial color="#1e293b" transparent opacity={0.95 * labelOpacity} />
          </mesh>
          {/* Subtle border */}
          <mesh position={[0, 0, -0.02]}>
            <planeGeometry args={[1.06, 0.34]} />
            <meshBasicMaterial color={mainColor} transparent opacity={0.4 * labelOpacity} />
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
