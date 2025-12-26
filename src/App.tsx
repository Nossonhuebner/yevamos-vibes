import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { Scene } from './components/Scene';
import { Timeline } from './components/Timeline';
import { Toolbar } from './components/Toolbar';
import { Legend } from './components/Legend';
import { ContextMenu, ContextMenuItem } from './components/ContextMenu';
import { SelectionBox } from './components/SelectionBox';
import { AddPersonModal } from './components/AddPersonModal';
import { EditDescriptionModal } from './components/EditDescriptionModal';
import { useGraphStore, useCurrentResolvedState } from './store/graphStore';
import { loadFromLocalStorage, saveToLocalStorage } from './utils/persistence';
import { isPersonDead } from './utils/deltaResolver';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTranslation } from './hooks/useTranslation';

function App() {
  const graph = useGraphStore((state) => state.graph);
  const loadGraph = useGraphStore((state) => state.loadGraph);
  const contextMenu = useGraphStore((state) => state.contextMenu);
  const closeContextMenu = useGraphStore((state) => state.closeContextMenu);
  const addPerson = useGraphStore((state) => state.addPerson);
  const markPersonDead = useGraphStore((state) => state.markPersonDead);
  const purgePerson = useGraphStore((state) => state.purgePerson);
  const removeRelationship = useGraphStore((state) => state.removeRelationship);
  const updateRelationship = useGraphStore((state) => state.updateRelationship);
  const addRelationship = useGraphStore((state) => state.addRelationship);
  const addChildToRelationship = useGraphStore((state) => state.addChildToRelationship);
  const selectedNodeIds = useGraphStore((state) => state.selectedNodeIds);
  const clearNodeSelection = useGraphStore((state) => state.clearNodeSelection);
  const currentSliceIndex = useGraphStore((state) => state.currentSliceIndex);
  const removeSlice = useGraphStore((state) => state.removeSlice);
  const updateSliceLabel = useGraphStore((state) => state.updateSliceLabel);
  const resolvedState = useCurrentResolvedState();
  const { t } = useTranslation();

  // Initialize keyboard shortcuts for walkthrough
  useKeyboardShortcuts();

  // Add Person modal state
  const [addPersonModal, setAddPersonModal] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    position3D: { x: number; y: number };
  }>({ isOpen: false, position: { x: 0, y: 0 }, position3D: { x: 0, y: 0 } });

  // Add Child modal state (for adding child to a relationship)
  const [addChildModal, setAddChildModal] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    relationshipId: string | null;
  }>({ isOpen: false, position: { x: 0, y: 0 }, relationshipId: null });

  // Edit description modal state
  const [editDescriptionModal, setEditDescriptionModal] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    sliceIndex: number;
    currentLabel: string;
  }>({ isOpen: false, position: { x: 0, y: 0 }, sliceIndex: 0, currentLabel: '' });

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, visible: true });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const selectionBox = useGraphStore((state) => state.selectionBox);
  const startSelectionBox = useGraphStore((state) => state.startSelectionBox);
  const updateSelectionBox = useGraphStore((state) => state.updateSelectionBox);
  const finishSelectionBox = useGraphStore((state) => state.finishSelectionBox);

  const isSelectingRef = useRef(false);

  // Handle shift+drag for selection box
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.shiftKey && e.button === 0) {
      isSelectingRef.current = true;
      startSelectionBox(e.clientX, e.clientY);
    }
  }, [startSelectionBox]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isSelectingRef.current && selectionBox) {
      updateSelectionBox(e.clientX, e.clientY);
    }
  }, [selectionBox, updateSelectionBox]);

  const handleMouseUp = useCallback(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      finishSelectionBox();
    }
  }, [finishSelectionBox]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadFromLocalStorage();
    if (saved) {
      loadGraph(saved);
    }
  }, [loadGraph]);

  // Auto-save to localStorage on changes
  useEffect(() => {
    saveToLocalStorage(graph);
  }, [graph]);

  // Build context menu items based on target
  const menuItems = useMemo((): ContextMenuItem[] => {
    if (!contextMenu?.target) return [];

    const target = contextMenu.target;

    if (target.type === 'slice') {
      // Clear any node selection when clicking on slice
      if (selectedNodeIds.length > 0) {
        clearNodeSelection();
      }
      const currentSlice = graph.slices[target.sliceIndex];
      const items: ContextMenuItem[] = [
        {
          label: t('addPerson'),
          onClick: () => {
            setAddPersonModal({
              isOpen: true,
              position: { x: contextMenu.screenX, y: contextMenu.screenY },
              position3D: target.position3D,
            });
          },
        },
        {
          label: t('editDescription'),
          onClick: () => {
            setEditDescriptionModal({
              isOpen: true,
              position: { x: contextMenu.screenX, y: contextMenu.screenY },
              sliceIndex: target.sliceIndex,
              currentLabel: currentSlice?.label || '',
            });
          },
        },
      ];

      // Only allow deleting if there's more than one slice
      if (graph.slices.length > 1) {
        items.push({
          label: t('deleteSlice'),
          onClick: () => {
            if (confirm(t('deleteSliceConfirm'))) {
              removeSlice(target.sliceIndex);
            }
          },
          danger: true,
        });
      }

      return items;
    }

    if (target.type === 'person') {
      const person = resolvedState.nodes.get(target.personId);
      if (!person) return [];

      // Check if there's a selected node and we're right-clicking on a different node
      const selectedNodeId = selectedNodeIds.length === 1 ? selectedNodeIds[0] : null;
      if (selectedNodeId && selectedNodeId !== target.personId) {
        const selectedPerson = resolvedState.nodes.get(selectedNodeId);
        if (selectedPerson) {
          // Check if they are opposite sexes
          if (selectedPerson.gender === person.gender) {
            // Same sex - show error toast
            showToast(t('sameGenderError'));
            clearNodeSelection();
            return [];
          }

          // Check if these two are already married to each other
          const existingMarriage = Array.from(resolvedState.edges.values()).find(
            (edge) =>
              edge.type === 'marriage' &&
              ((edge.sourceId === selectedNodeId && edge.targetId === target.personId) ||
                (edge.sourceId === target.personId && edge.targetId === selectedNodeId))
          );

          if (existingMarriage) {
            // They are married - only show divorce option
            return [
              {
                label: `${t('divorce')}: ${selectedPerson.name} & ${person.name}`,
                onClick: () => {
                  updateRelationship(existingMarriage.id, { type: 'divorce' });
                  clearNodeSelection();
                },
              },
            ];
          }

          // Determine who is the woman
          const woman = selectedPerson.gender === 'female' ? selectedPerson : person;

          // Check if the woman is currently married (has an active marriage)
          const womanIsMarried = Array.from(resolvedState.edges.values()).some(
            (edge) =>
              edge.type === 'marriage' &&
              (edge.sourceId === woman.id || edge.targetId === woman.id)
          );

          const items: ContextMenuItem[] = [];

          // Marriage option - only if woman is not already married
          if (!womanIsMarried) {
            items.push({
              label: `${t('addMarriage')}: ${selectedPerson.name} & ${person.name}`,
              onClick: () => {
                addRelationship({
                  type: 'marriage',
                  sourceId: selectedNodeId,
                  targetId: target.personId,
                });
                clearNodeSelection();
              },
            });
          }

          // Unmarried relations - always available for opposite sex
          items.push({
            label: `${t('addUnmarriedRelations')}: ${selectedPerson.name} & ${person.name}`,
            onClick: () => {
              addRelationship({
                type: 'unmarried-relations',
                sourceId: selectedNodeId,
                targetId: target.personId,
              });
              clearNodeSelection();
            },
          });

          return items;
        }
      }

      // Normal person context menu (no selection or clicking on selected node)
      const isDead = isPersonDead(person, currentSliceIndex);

      const items: ContextMenuItem[] = [
        {
          label: t('markAsDead'),
          onClick: () => markPersonDead(target.personId),
          disabled: isDead,
        },
        {
          label: t('removeFromAllSlices'),
          onClick: () => {
            if (confirm(`${person.name} ${t('removePersonConfirm')}`)) {
              purgePerson(target.personId);
            }
          },
          danger: true,
        },
      ];

      return items;
    }

    if (target.type === 'edge') {
      const edge = resolvedState.edges.get(target.edgeId);
      if (!edge) return [];

      const items: ContextMenuItem[] = [];

      // Add Child option for marriage and unmarried-relations
      if (edge.type === 'marriage' || edge.type === 'unmarried-relations') {
        items.push({
          label: t('addChild'),
          onClick: () => {
            setAddChildModal({
              isOpen: true,
              position: { x: contextMenu.screenX, y: contextMenu.screenY },
              relationshipId: target.edgeId,
            });
          },
        });
      }

      if (edge.type === 'marriage') {
        items.push({
          label: t('markAsDivorced'),
          onClick: () => updateRelationship(target.edgeId, { type: 'divorce' }),
        });
      }

      items.push({
        label: t('removeRelationship'),
        onClick: () => removeRelationship(target.edgeId),
        danger: true,
      });

      return items;
    }

    return [];
  }, [contextMenu, resolvedState, currentSliceIndex, markPersonDead, purgePerson, removeRelationship, updateRelationship, selectedNodeIds, addRelationship, clearNodeSelection, showToast, graph.slices.length, removeSlice, t]);

  const handleAddPerson = useCallback((name: string, gender: 'male' | 'female') => {
    addPerson({
      name,
      gender,
      position: addPersonModal.position3D,
    });
  }, [addPerson, addPersonModal.position3D]);

  const handleAddChild = useCallback((name: string, gender: 'male' | 'female') => {
    if (addChildModal.relationshipId) {
      addChildToRelationship(addChildModal.relationshipId, { name, gender, position: { x: 0, y: 0 } });
    }
  }, [addChildToRelationship, addChildModal.relationshipId]);

  return (
    <div className="app-container">
      <div
        className="canvas-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Scene />
        <Toolbar />
        <Legend />
        <Timeline />
        <SelectionBox />
      </div>

      {/* Context Menu */}
      {contextMenu && menuItems.length > 0 && (
        <ContextMenu
          x={contextMenu.screenX}
          y={contextMenu.screenY}
          items={menuItems}
          onClose={closeContextMenu}
        />
      )}

      {/* Add Person Modal */}
      <AddPersonModal
        isOpen={addPersonModal.isOpen}
        position={addPersonModal.position}
        onClose={() => setAddPersonModal(prev => ({ ...prev, isOpen: false }))}
        onSubmit={handleAddPerson}
      />

      {/* Add Child Modal */}
      <AddPersonModal
        isOpen={addChildModal.isOpen}
        position={addChildModal.position}
        onClose={() => setAddChildModal(prev => ({ ...prev, isOpen: false }))}
        onSubmit={handleAddChild}
        titleKey="addChild"
      />

      {/* Edit Description Modal */}
      {editDescriptionModal.isOpen && (
        <EditDescriptionModal
          position={editDescriptionModal.position}
          currentLabel={editDescriptionModal.currentLabel}
          onClose={() => setEditDescriptionModal(prev => ({ ...prev, isOpen: false }))}
          onSubmit={(label) => {
            updateSliceLabel(editDescriptionModal.sliceIndex, label);
            setEditDescriptionModal(prev => ({ ...prev, isOpen: false }));
          }}
        />
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#ef4444',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 300,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
