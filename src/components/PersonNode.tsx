import { useState, useRef, useEffect, useCallback } from 'react';
import { Text } from '@react-three/drei';
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Person } from '@/types';
import { useGraphStore } from '@/store/graphStore';
import { useHalachaStore } from '@/store/halachaStore';
import { isPersonDead } from '@/utils/deltaResolver';
import { getPersonEmojiChar } from '@/utils/emojiTextures';
import { isNodeHighlightedAsNew, isNodeHighlightedAsDead } from '@/utils/sliceDelta';
import { EmojiSprite } from './EmojiSprite';

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

  // Halacha mode state
  const halachaEnabled = useHalachaStore((state) => state.enabled);
  const lockedPersonId = useHalachaStore((state) => state.lockedPersonId);
  const setLockedPerson = useHalachaStore((state) => state.setLockedPerson);
  const setHoveredPerson = useHalachaStore((state) => state.setHoveredPerson);
  const setShowStatusPanel = useHalachaStore((state) => state.setShowStatusPanel);

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
  const color = isSelected ? '#22d3ee' : hovered ? '#a1a1aa' : baseColor;
  const emoji = getPersonEmojiChar(person.id, person.gender);

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

  // Handle pointer/touch move during drag (works for both mouse and touch)
  const onPointerMove = useCallback((e: PointerEvent | TouchEvent) => {
    if (!isDragging || !dragStartPosition || !groupInitialPositions) return;

    // Prevent default to stop scrolling on mobile
    e.preventDefault();

    // Get client coordinates (handle both mouse and touch)
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Convert to normalized device coordinates
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

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

  // End drag on pointer/touch up
  const onPointerUp = useCallback(() => {
    if (isDragging) {
      endDrag();
    }
  }, [isDragging, endDrag]);

  // Add/remove global listeners when dragging (both mouse and touch)
  useEffect(() => {
    if (isDragging) {
      // Use pointer events for unified mouse/touch handling
      window.addEventListener('pointermove', onPointerMove as EventListener);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
      // Also add touch events as fallback for better mobile support
      window.addEventListener('touchmove', onPointerMove as EventListener, { passive: false });
      window.addEventListener('touchend', onPointerUp);
      window.addEventListener('touchcancel', onPointerUp);
      return () => {
        window.removeEventListener('pointermove', onPointerMove as EventListener);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        window.removeEventListener('touchmove', onPointerMove as EventListener);
        window.removeEventListener('touchend', onPointerUp);
        window.removeEventListener('touchcancel', onPointerUp);
      };
    }
  }, [isDragging, onPointerMove, onPointerUp]);

  const handleNodeClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();

    // Handle halacha mode
    if (halachaEnabled && isCurrentSlice) {
      if (lockedPersonId === person.id) {
        // Clicking the locked person clears the lock
        setLockedPerson(null);
        setHoveredPerson(null);
      } else if (lockedPersonId) {
        // Clicking another person while locked - show status panel for comparison
        setShowStatusPanel(true);
      } else {
        // Lock this person for halacha viewing
        setLockedPerson(person.id);
        setShowStatusPanel(true);
      }
      return;
    }

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

  // Opacity values
  const nodeOpacity = isDead ? 0.25 : (isCurrentSlice ? 1 : 0.25);
  const shadowOpacity = isCurrentSlice ? 0.4 : 0.05;

  // Position on vertical XY plane
  return (
    <group position={[displayPosition.x, displayPosition.y, 0.1]}>
      {/* Shadow disc - offset behind and below for depth */}
      <mesh position={[0.06, -0.06, -0.05]} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.48, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={shadowOpacity} />
      </mesh>

      {/* Outer rim/border for depth */}
      <mesh position={[0, 0, -0.02]} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.42, 0.5, 32]} />
        <meshBasicMaterial
          color={isCurrentSlice ? '#1e293b' : '#0f172a'}
          transparent
          opacity={isCurrentSlice ? 0.8 : 0.15}
        />
      </mesh>

      {/* Node circular disc */}
      <mesh
        ref={meshRef}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={handleNodeClick}
        onContextMenu={handleContextMenu}
        onPointerOver={() => {
          if (canInteract || (halachaEnabled && isCurrentSlice)) {
            setHovered(true);
            document.body.style.cursor = 'pointer';
            // Track hovered person for halacha mode
            if (halachaEnabled && lockedPersonId && lockedPersonId !== person.id) {
              setHoveredPerson(person.id);
            }
          }
        }}
        onPointerOut={() => {
          setHovered(false);
          if (!handleHovered) {
            document.body.style.cursor = 'auto';
          }
          // Clear hovered person for halacha mode
          if (halachaEnabled) {
            setHoveredPerson(null);
          }
        }}
      >
        <cylinderGeometry args={[0.42, 0.42, 0.1, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={
            isHighlightedAsNew ? '#34d399' :
            isHighlightedAsDead ? '#f87171' :
            isSelected ? '#22d3ee' :
            (isCurrentSlice ? baseColor : '#000000')
          }
          emissiveIntensity={
            isHighlightedAsNew || isHighlightedAsDead ? glowIntensity :
            isSelected ? 0.4 :
            (isCurrentSlice ? 0.15 : 0)
          }
          transparent
          opacity={nodeOpacity}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Inner highlight for glossy effect */}
      {isCurrentSlice && !isDead && (
        <mesh position={[-0.08, 0.08, 0.06]} rotation={[0, 0, 0]}>
          <circleGeometry args={[0.12, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
        </mesh>
      )}

      {/* Person emoji on the node */}
      <EmojiSprite
        emoji={emoji}
        position={[0, 0, 0.1]}
        size={0.42}
        opacity={isDead ? 0.25 : (isCurrentSlice ? 1 : 0.12)}
      />

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0, 0.02]}>
          <ringGeometry args={[0.46, 0.52, 32]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Drag handle - only visible on current slice, not dead */}
      {isCurrentSlice && !isDead && (
        <group position={[0, -0.55, 0.1]}>
          {/* Handle background - larger for easier touch targeting */}
          <mesh
            onPointerDown={(e) => {
              // Prevent camera controls from intercepting touch/pointer
              e.stopPropagation();
              handleDragStart(e);
            }}
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
            <circleGeometry args={[0.22, 24]} />
            <meshStandardMaterial
              color={handleHovered || isDragging ? '#22d3ee' : '#334155'}
              transparent
              opacity={0.9}
            />
          </mesh>
          {/* Drag icon (grip pattern) */}
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.16}
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
        position={[0, 0.6, 0.1]}
        fontSize={0.2}
        color={isDead ? '#6b7280' : (isCurrentSlice ? '#f8fafc' : '#475569')}
        anchorX="center"
        anchorY="bottom"
        fillOpacity={isCurrentSlice ? 1 : 0.15}
        outlineWidth={isCurrentSlice ? 0.012 : 0}
        outlineColor="#0f172a"
      >
        {person.name}
      </Text>
    </group>
  );
}
