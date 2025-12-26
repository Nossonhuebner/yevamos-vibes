import { useState, useRef, useEffect, useCallback } from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Person } from '@/types';
import { useGraphStore } from '@/store/graphStore';
import { isPersonDead } from '@/utils/deltaResolver';
import { getPersonEmoji } from '@/utils/emojiUtils';
import { isNodeHighlightedAsNew, isNodeHighlightedAsDead } from '@/utils/sliceDelta';

interface PersonNodeProps {
  person: Person;
  sliceIndex: number;
  isCurrentSlice: boolean;
}

export function PersonNode({ person, sliceIndex, isCurrentSlice }: PersonNodeProps) {
  const selectedNodeIds = useGraphStore((state) => state.selectedNodeIds);
  const toggleNodeSelection = useGraphStore((state) => state.toggleNodeSelection);
  const clearNodeSelection = useGraphStore((state) => state.clearNodeSelection);
  const currentSliceIndex = useGraphStore((state) => state.currentSliceIndex);
  const updatePersonPosition = useGraphStore((state) => state.updatePersonPosition);
  const updateMultiplePositions = useGraphStore((state) => state.updateMultiplePositions);
  const setIsDraggingNode = useGraphStore((state) => state.setIsDraggingNode);
  const openContextMenu = useGraphStore((state) => state.openContextMenu);
  const resolvedStates = useGraphStore((state) => state.resolvedStates);
  const highlightedChanges = useGraphStore((state) => state.highlightedChanges);
  const viewMode = useGraphStore((state) => state.viewMode);

  const { camera, gl } = useThree();
  const [hovered, setHovered] = useState(false);
  const [handleHovered, setHandleHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [groupInitialPositions, setGroupInitialPositions] = useState<Map<string, { x: number; y: number }> | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const raycaster = useRef(new THREE.Raycaster());

  // Animation state for highlight effects
  const glowTimeRef = useRef(0);
  const [glowIntensity, setGlowIntensity] = useState(0);

  const isSelectedInStore = selectedNodeIds.includes(person.id);
  const canInteract = sliceIndex === currentSliceIndex;
  const isDead = isPersonDead(person, sliceIndex);

  // Highlight detection for transition effects (only in Focus mode on current slice)
  const isHighlightedAsNew = isCurrentSlice && viewMode === 'focus' &&
    isNodeHighlightedAsNew(person.id, highlightedChanges);
  const isHighlightedAsDead = isCurrentSlice && viewMode === 'focus' &&
    isNodeHighlightedAsDead(person.id, highlightedChanges);

  // Selection indicators only show in the current slice
  const isSelected = isSelectedInStore && isCurrentSlice;

  // Use drag position while dragging, otherwise use person's actual position
  const displayPosition = dragPosition || person.position;

  // Node colors: use person's assigned color, adjusted for state
  const baseColor = isDead ? '#6b7280' : person.color;
  const color = isSelected ? '#fbbf24' : hovered ? '#60a5fa' : baseColor;
  const emoji = getPersonEmoji(person.id, person.gender, isDead);

  // Check if this is a group drag (multiple nodes selected including this one)
  const isGroupDrag = isSelected && selectedNodeIds.length > 1;

  // End dragging - positions are already updated in real-time during drag
  const endDrag = useCallback(() => {
    setIsDragging(false);
    setIsDraggingNode(false);
    setDragPosition(null);
    setDragStartPosition(null);
    setGroupInitialPositions(null);
    document.body.style.cursor = 'auto';
  }, [setIsDraggingNode]);

  // Global mouse move during drag
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStartPosition || !groupInitialPositions) return;

    // Convert mouse position to normalized device coordinates
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to find intersection with the XY plane at z=0
    raycaster.current.setFromCamera(new THREE.Vector2(x, y), camera);
    const intersection = new THREE.Vector3();
    raycaster.current.ray.intersectPlane(planeRef.current, intersection);

    if (intersection) {
      const newPosition = { x: intersection.x, y: intersection.y };
      setDragPosition(newPosition);

      // Update store in real-time (like selection box dragging)
      const deltaX = newPosition.x - dragStartPosition.x;
      const deltaY = newPosition.y - dragStartPosition.y;

      if (isGroupDrag) {
        // Update all selected nodes
        const updates = selectedNodeIds.map((nodeId) => {
          const initialPos = groupInitialPositions.get(nodeId);
          if (initialPos) {
            return {
              nodeId,
              position: { x: initialPos.x + deltaX, y: initialPos.y + deltaY },
            };
          }
          return null;
        }).filter((u): u is { nodeId: string; position: { x: number; y: number } } => u !== null);

        updateMultiplePositions(updates);
      } else {
        // Single node drag - update in real-time
        updatePersonPosition(person.id, newPosition);
      }
    }
  }, [isDragging, dragStartPosition, groupInitialPositions, isGroupDrag, selectedNodeIds, camera, gl.domElement, person.id, updatePersonPosition, updateMultiplePositions]);

  // Global mouse up to end drag
  const onMouseUp = useCallback(() => {
    if (isDragging) {
      endDrag();
    }
  }, [isDragging, endDrag]);

  // Add/remove global listeners when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [isDragging, onMouseMove, onMouseUp]);

  const handleNodeClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (canInteract) {
      // If another node is selected, just clear selection (don't select this one)
      if (selectedNodeIds.length > 0 && !selectedNodeIds.includes(person.id)) {
        clearNodeSelection();
      } else {
        // Toggle this node's selection (select if none, deselect if already selected)
        toggleNodeSelection(person.id);
      }
    }
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    if (!canInteract) return;

    e.stopPropagation();
    e.nativeEvent.preventDefault();

    openContextMenu(
      { type: 'person', personId: person.id },
      e.nativeEvent.clientX,
      e.nativeEvent.clientY
    );
  };

  // Drag handle events - only the handle initiates dragging
  const handleDragStart = (e: ThreeEvent<PointerEvent>) => {
    if (!canInteract) return;

    e.stopPropagation();

    // Capture initial positions of all selected nodes for group drag
    const currentState = resolvedStates[currentSliceIndex];
    const initialPositions = new Map<string, { x: number; y: number }>();

    if (isSelected && selectedNodeIds.length > 1) {
      // Group drag - capture all selected node positions
      selectedNodeIds.forEach((nodeId) => {
        const node = currentState?.nodes.get(nodeId);
        if (node) {
          initialPositions.set(nodeId, { ...node.position });
        }
      });
    } else {
      // Single node drag
      initialPositions.set(person.id, { ...person.position });
    }

    setGroupInitialPositions(initialPositions);
    setDragStartPosition({ ...person.position });
    setIsDragging(true);
    setIsDraggingNode(true);
    setDragPosition(person.position);
    document.body.style.cursor = 'grabbing';
  };

  // Subtle hover animation and glow effect for highlighted nodes
  useFrame((_, delta) => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.1 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    // Pulse glow animation for newly highlighted nodes
    if (isHighlightedAsNew) {
      glowTimeRef.current += delta * 4; // Speed of pulse
      const newGlow = 0.5 + Math.sin(glowTimeRef.current) * 0.3;
      setGlowIntensity(newGlow);
    } else if (isHighlightedAsDead) {
      // Steady glow for death highlight
      setGlowIntensity(0.6);
    } else {
      glowTimeRef.current = 0;
      if (glowIntensity > 0) {
        setGlowIntensity(0);
      }
    }
  });

  // Position on vertical XY plane
  return (
    <group position={[displayPosition.x, displayPosition.y, 0.1]}>
      {/* Node rounded box */}
      <RoundedBox
        ref={meshRef}
        args={[0.6, 0.6, 0.15]}
        radius={0.1}
        smoothness={4}
        onClick={handleNodeClick}
        onContextMenu={handleContextMenu}
        onPointerOver={() => {
          if (canInteract) {
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={() => {
          setHovered(false);
          if (!handleHovered) {
            document.body.style.cursor = 'auto';
          }
        }}
      >
        <meshStandardMaterial
          color={color}
          emissive={
            isHighlightedAsNew ? '#22c55e' :  // Green glow for new nodes
            isHighlightedAsDead ? '#ef4444' :  // Red glow for death highlight
            isSelected ? '#fbbf24' : '#000000'
          }
          emissiveIntensity={
            isHighlightedAsNew || isHighlightedAsDead ? glowIntensity :
            isSelected ? 0.3 : 0
          }
          transparent
          opacity={isDead ? 0.3 : (isCurrentSlice ? 1 : 0.5)}
        />
      </RoundedBox>

      {/* Person emoji on the node */}
      <Text
        position={[0, 0, 0.1]}
        fontSize={0.35}
        color={isDead ? '#4b5563' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
      >
        {emoji}
      </Text>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[0.4, 0.5, 32]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Drag handle - only visible on current slice, not dead */}
      {isCurrentSlice && !isDead && (
        <group position={[0, -0.45, 0.1]}>
          {/* Handle background */}
          <mesh
            onPointerDown={handleDragStart}
            onPointerOver={() => {
              setHandleHovered(true);
              if (!isDragging) {
                document.body.style.cursor = 'grab';
              }
            }}
            onPointerOut={() => {
              setHandleHovered(false);
              if (!isDragging) {
                document.body.style.cursor = 'auto';
              }
            }}
          >
            <circleGeometry args={[0.15, 16]} />
            <meshStandardMaterial
              color={handleHovered || isDragging ? '#60a5fa' : '#475569'}
              transparent
              opacity={0.9}
            />
          </mesh>
          {/* Drag icon (four arrows pattern) */}
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.12}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            ⋮⋮
          </Text>
        </group>
      )}

      {/* Name label - above node */}
      <Text
        position={[0, 0.55, 0.1]}
        fontSize={0.22}
        color={isDead ? '#6b7280' : (isCurrentSlice ? '#f8fafc' : '#94a3b8')}
        anchorX="center"
        anchorY="bottom"
      >
        {person.name}
      </Text>
    </group>
  );
}
