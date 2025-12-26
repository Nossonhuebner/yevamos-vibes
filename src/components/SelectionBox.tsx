import { useCallback } from 'react';
import { useGraphStore } from '@/store/graphStore';

export function SelectionBox() {
  const selectionBox = useGraphStore((state) => state.selectionBox);
  const selectionBounds = useGraphStore((state) => state.selectionBounds);
  const selectedNodeIds = useGraphStore((state) => state.selectedNodeIds);
  const clearNodeSelection = useGraphStore((state) => state.clearNodeSelection);
  const startDraggingSelection = useGraphStore((state) => state.startDraggingSelection);
  const currentSliceIndex = useGraphStore((state) => state.currentSliceIndex);
  const resolvedStates = useGraphStore((state) => state.resolvedStates);

  // Handle drag start on the handle
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Capture initial positions of all selected nodes
    const currentState = resolvedStates[currentSliceIndex];
    const positions = new Map<string, { x: number; y: number }>();
    selectedNodeIds.forEach((id) => {
      const node = currentState?.nodes.get(id);
      if (node) {
        positions.set(id, { ...node.position });
      }
    });

    // Start dragging with screen position and initial node positions
    // The SelectionBoxHandler (inside the Canvas) will handle the actual position updates
    startDraggingSelection(e.clientX, e.clientY, positions);
  }, [selectedNodeIds, resolvedStates, currentSliceIndex, startDraggingSelection]);

  // Render the dragging selection box (during shift+drag)
  if (selectionBox) {
    const { startX, startY, endX, endY } = selectionBox;
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    return (
      <div
        style={{
          position: 'fixed',
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
          border: '2px dashed #22d3ee',
          backgroundColor: 'rgba(34, 211, 238, 0.15)',
          pointerEvents: 'none',
          zIndex: 100,
        }}
      />
    );
  }

  // Render persistent selection bounds with drag handle
  if (selectionBounds && selectedNodeIds.length > 0) {
    return (
      <>
        {/* Click outside overlay to deselect */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
          }}
          onClick={(e) => {
            // Check if click is outside the selection bounds
            const { left, top, width, height } = selectionBounds;
            if (
              e.clientX < left ||
              e.clientX > left + width ||
              e.clientY < top ||
              e.clientY > top + height
            ) {
              clearNodeSelection();
            }
          }}
        />

        {/* Selection bounds rectangle */}
        <div
          style={{
            position: 'fixed',
            left: `${selectionBounds.left}px`,
            top: `${selectionBounds.top}px`,
            width: `${selectionBounds.width}px`,
            height: `${selectionBounds.height}px`,
            border: '2px solid #22d3ee',
            backgroundColor: 'rgba(34, 211, 238, 0.08)',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        />

        {/* Drag handle at bottom center */}
        <div
          style={{
            position: 'fixed',
            left: `${selectionBounds.left + selectionBounds.width / 2 - 20}px`,
            top: `${selectionBounds.top + selectionBounds.height + 8}px`,
            width: '40px',
            height: '24px',
            backgroundColor: '#22d3ee',
            borderRadius: '4px',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 101,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
          onMouseDown={handleDragStart}
        >
          <span style={{ color: '#0c0f14', fontSize: '12px', userSelect: 'none' }}>⋮⋮</span>
        </div>

        {/* Selection count badge */}
        <div
          style={{
            position: 'fixed',
            left: `${selectionBounds.left + selectionBounds.width / 2 - 12}px`,
            top: `${selectionBounds.top - 28}px`,
            padding: '2px 8px',
            backgroundColor: '#22d3ee',
            color: '#0c0f14',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 'bold',
            zIndex: 101,
            userSelect: 'none',
          }}
        >
          {selectedNodeIds.length}
        </div>
      </>
    );
  }

  return null;
}
