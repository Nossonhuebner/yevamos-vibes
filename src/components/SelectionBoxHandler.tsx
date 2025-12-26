import { useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGraphStore, useCurrentResolvedState } from '@/store/graphStore';
import { getNodesArray } from '@/utils/deltaResolver';

/**
 * This component runs inside the Three.js canvas and handles:
 * 1. Computing which nodes fall within the selection box (hit-testing)
 * 2. Converting screen coordinates to world coordinates for selection dragging
 */
export function SelectionBoxHandler() {
  const { camera, gl } = useThree();
  const selectionBox = useGraphStore((state) => state.selectionBox);
  const setSelectedNodes = useGraphStore((state) => state.setSelectedNodes);
  const setSelectionBounds = useGraphStore((state) => state.setSelectionBounds);
  const currentSliceIndex = useGraphStore((state) => state.currentSliceIndex);
  const isDraggingSelection = useGraphStore((state) => state.isDraggingSelection);
  const selectionDragState = useGraphStore((state) => state.selectionDragState);
  const stopDraggingSelection = useGraphStore((state) => state.stopDraggingSelection);
  const updateMultiplePositions = useGraphStore((state) => state.updateMultiplePositions);
  const resolvedState = useCurrentResolvedState();

  const prevSelectionBox = useRef(selectionBox);
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const raycaster = useRef(new THREE.Raycaster());

  // Get the Z position of the current slice
  const SLICE_SPACING = 5;
  const currentSliceZ = currentSliceIndex * SLICE_SPACING;

  // Convert screen coordinates to world coordinates on the XY plane at z=0
  const screenToWorld = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((screenX - rect.left) / rect.width) * 2 - 1;
    const y = -((screenY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(new THREE.Vector2(x, y), camera);
    const intersection = new THREE.Vector3();
    raycaster.current.ray.intersectPlane(planeRef.current, intersection);

    return { x: intersection.x, y: intersection.y };
  }, [camera, gl.domElement]);

  // Handle selection dragging - listen for global mouse events when dragging
  useEffect(() => {
    if (!isDraggingSelection || !selectionDragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Convert start and current screen positions to world coordinates
      const startWorld = screenToWorld(selectionDragState.startScreenX, selectionDragState.startScreenY);
      const currentWorld = screenToWorld(e.clientX, e.clientY);

      // Calculate world-space delta
      const deltaX = currentWorld.x - startWorld.x;
      const deltaY = currentWorld.y - startWorld.y;

      // Update all selected node positions
      const updates: { nodeId: string; position: { x: number; y: number } }[] = [];
      selectionDragState.initialPositions.forEach((initialPos, nodeId) => {
        updates.push({
          nodeId,
          position: { x: initialPos.x + deltaX, y: initialPos.y + deltaY },
        });
      });

      if (updates.length > 0) {
        updateMultiplePositions(updates);
      }
    };

    const handleMouseUp = () => {
      stopDraggingSelection();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSelection, selectionDragState, screenToWorld, updateMultiplePositions, stopDraggingSelection]);

  useEffect(() => {
    // Detect when selection box goes from active to null (finished)
    if (prevSelectionBox.current && !selectionBox) {
      const box = prevSelectionBox.current;
      const rect = gl.domElement.getBoundingClientRect();

      // Normalize selection box coordinates
      const left = Math.min(box.startX, box.endX);
      const right = Math.max(box.startX, box.endX);
      const top = Math.min(box.startY, box.endY);
      const bottom = Math.max(box.startY, box.endY);

      // Only process if box has meaningful size
      if (right - left > 5 && bottom - top > 5) {
        const nodes = getNodesArray(resolvedState);
        const selectedIds: string[] = [];
        let minScreenX = Infinity, maxScreenX = -Infinity;
        let minScreenY = Infinity, maxScreenY = -Infinity;

        nodes.forEach((node) => {
          // Create 3D position on current slice
          const pos3D = new THREE.Vector3(node.position.x, node.position.y, currentSliceZ + 0.1);

          // Project to screen coordinates
          const projected = pos3D.clone().project(camera);

          // Convert from NDC (-1 to 1) to screen pixels
          const screenX = ((projected.x + 1) / 2) * rect.width + rect.left;
          const screenY = ((-projected.y + 1) / 2) * rect.height + rect.top;

          // Check if node center is within selection box
          if (screenX >= left && screenX <= right && screenY >= top && screenY <= bottom) {
            selectedIds.push(node.id);
            // Track bounds of selected nodes
            minScreenX = Math.min(minScreenX, screenX - 40); // Account for node size
            maxScreenX = Math.max(maxScreenX, screenX + 40);
            minScreenY = Math.min(minScreenY, screenY - 40);
            maxScreenY = Math.max(maxScreenY, screenY + 40);
          }
        });

        if (selectedIds.length > 0) {
          setSelectedNodes(selectedIds);
          // Set persistent selection bounds
          setSelectionBounds({
            left: minScreenX,
            top: minScreenY,
            width: maxScreenX - minScreenX,
            height: maxScreenY - minScreenY,
          });
        }
      }
    }

    prevSelectionBox.current = selectionBox;
  }, [selectionBox, camera, gl, resolvedState, currentSliceZ, setSelectedNodes, setSelectionBounds]);

  return null;
}
