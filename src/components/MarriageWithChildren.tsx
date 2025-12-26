import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Relationship, RELATIONSHIP_STYLES, Person } from '@/types';
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

  const isSelected = selectedEdgeId === edge.id;
  const isCurrentSlice = sliceIndex === currentSliceIndex;
  const style = RELATIONSHIP_STYLES[edge.type];
  const canInteract = isCurrentSlice;

  const color = isSelected ? '#fbbf24' : (isInvolvingDeadPerson ? '#6b7280' : style.color);
  const opacity = isInvolvingDeadPerson ? 0.2 : (isCurrentSlice ? 1 : 0.4);
  const lineWidth = style.lineWidth * (isSelected ? 1.5 : 1);
  const childLineWidth = 3 * (isSelected ? 1.5 : 1); // Wider lines for child connections

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

    // Find the child Y level (lowest child Y position)
    const childY = Math.min(...children.map(c => c.position.y));

    // Vertical drop from midpoint
    const dropStart = new THREE.Vector3(midX, midY, 0.05);
    const dropEnd = new THREE.Vector3(midX, childY + 0.8, 0.05);

    // Horizontal bar at the children level
    const sortedChildren = [...children].sort((a, b) => a.position.x - b.position.x);
    const leftMost = sortedChildren[0].position.x;
    const rightMost = sortedChildren[sortedChildren.length - 1].position.x;

    const barStart = new THREE.Vector3(leftMost, childY + 0.8, 0.05);
    const barEnd = new THREE.Vector3(rightMost, childY + 0.8, 0.05);

    // Straight line connections to each child
    const childConnections = sortedChildren.map((child) => {
      // For single child: draw from midpoint
      // For multiple children: draw from the horizontal bar level
      const isSingleChild = sortedChildren.length === 1;

      const startX = isSingleChild ? midX : child.position.x;
      const startY = isSingleChild ? midY : childY + 0.8;
      const endY = child.position.y + 0.5;

      const start = new THREE.Vector3(startX, startY, 0.05);
      const end = new THREE.Vector3(child.position.x, endY, 0.05);

      return { start, end, childX: child.position.x, childY: endY };
    });

    // Only show vertical drop and horizontal bar for multiple children
    const showDropAndBar = children.length > 1;

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

  return (
    <group>
      {/* Invisible click area for the marriage line */}
      <mesh
        position={[clickAreaGeometry.centerX, clickAreaGeometry.centerY, 0.05]}
        rotation={[0, 0, clickAreaGeometry.angle]}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <planeGeometry args={[clickAreaGeometry.length, 0.3]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Marriage line (horizontal between parents) */}
      <Line
        points={[tShape.marriageStart, tShape.marriageEnd]}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
        dashed={style.lineStyle === 'dashed'}
        dashSize={style.lineStyle === 'dashed' ? 0.2 : undefined}
        gapSize={style.lineStyle === 'dashed' ? 0.1 : undefined}
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

      {/* Straight lines to each child with arrows */}
      {tShape.childConnections.map((conn, index) => (
        <group key={index}>
          <Line
            points={[conn.start, conn.end]}
            color={color}
            lineWidth={childLineWidth}
            transparent
            opacity={opacity}
          />
          {/* Arrow head pointing down at child */}
          <mesh
            position={[conn.childX, conn.childY - 0.08, 0.06]}
            rotation={[0, 0, Math.PI]} // Point downward
          >
            <coneGeometry args={[0.1, 0.15, 8]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
