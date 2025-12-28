import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { Scene } from './components/Scene';
import { Timeline } from './components/Timeline';
import { Toolbar } from './components/Toolbar';
import { Legend } from './components/Legend';
import { ContextMenu, ContextMenuItem } from './components/ContextMenu';
import { SelectionBox } from './components/SelectionBox';
import { AddPersonModal } from './components/AddPersonModal';
import { AddRelationModal } from './components/AddRelationModal';
import { EditDescriptionModal } from './components/EditDescriptionModal';
import { useGraphStore, useCurrentResolvedState } from './store/graphStore';
import { loadFromLocalStorage, saveToLocalStorage, getGraphFromUrl, clearUrlData } from './utils/persistence';
import { preloadEmojiTextures } from './utils/emojiTextures';
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
  const editDescriptionModal = useGraphStore((state) => state.editDescriptionModal);
  const openEditDescription = useGraphStore((state) => state.openEditDescription);
  const closeEditDescription = useGraphStore((state) => state.closeEditDescription);
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

  // Add Relation modal state (for erusin/nisuin selection)
  const [addRelationModal, setAddRelationModal] = useState<{
    isOpen: boolean;
    sourceId: string;
    targetId: string;
    personAName: string;
    personBName: string;
  }>({ isOpen: false, sourceId: '', targetId: '', personAName: '', personBName: '' });

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; visible: boolean; type: 'error' | 'info' }>({ message: '', visible: false, type: 'error' });
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, type: 'error' | 'info' = 'error') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, visible: true, type });
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

  // Load from URL or localStorage on mount, and preload emoji textures
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // Preload emoji textures in the background
    preloadEmojiTextures();

    // First, check if there's graph data in the URL
    const urlGraph = getGraphFromUrl();
    if (urlGraph) {
      loadGraph(urlGraph);
      clearUrlData(); // Remove the data from URL to keep it clean
      showToast(t('loadedFromLink'), 'info');
      return;
    }

    // Otherwise, load from localStorage
    const saved = loadFromLocalStorage();
    if (saved) {
      loadGraph(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            openEditDescription(target.sliceIndex);
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

          // Check if these two have an existing marriage relationship (erusin or nisuin)
          const existingMarriage = Array.from(resolvedState.edges.values()).find(
            (edge) =>
              (edge.type === 'erusin' || edge.type === 'nisuin') &&
              ((edge.sourceId === selectedNodeId && edge.targetId === target.personId) ||
                (edge.sourceId === target.personId && edge.targetId === selectedNodeId))
          );

          if (existingMarriage) {
            // They are in erusin or nisuin - show appropriate options
            const items: ContextMenuItem[] = [];

            if (existingMarriage.type === 'erusin') {
              // Erusin state: can enter nisuin or divorce
              items.push({
                label: `${t('enterNisuin')}: ${selectedPerson.name} & ${person.name}`,
                onClick: () => {
                  updateRelationship(existingMarriage.id, { type: 'nisuin' });
                  clearNodeSelection();
                },
              });
            }

            // Both erusin and nisuin can divorce
            items.push({
              label: `${t('divorce')}: ${selectedPerson.name} & ${person.name}`,
              onClick: () => {
                updateRelationship(existingMarriage.id, { type: 'divorce' });
                clearNodeSelection();
              },
            });

            return items;
          }

          // Determine who is the woman
          const woman = selectedPerson.gender === 'female' ? selectedPerson : person;

          // Check if the woman is currently married (has an active erusin or nisuin with anyone)
          const womanMarriage = Array.from(resolvedState.edges.values()).find(
            (edge) =>
              (edge.type === 'erusin' || edge.type === 'nisuin') &&
              (edge.sourceId === woman.id || edge.targetId === woman.id)
          );

          const items: ContextMenuItem[] = [];

          if (womanMarriage) {
            // Woman is married to someone else - only show extra-marital relations option
            items.push({
              label: `${t('addExtraMaritalRelations')}: ${selectedPerson.name} & ${person.name}`,
              onClick: () => {
                addRelationship({
                  type: 'unmarried-relations',
                  sourceId: selectedNodeId,
                  targetId: target.personId,
                });
                clearNodeSelection();
              },
            });
          } else {
            // Woman is unmarried - show Add Relation option (opens modal with marriage/unmarried choice)
            items.push({
              label: `${t('addRelation')}: ${selectedPerson.name} & ${person.name}`,
              onClick: () => {
                setAddRelationModal({
                  isOpen: true,
                  sourceId: selectedNodeId,
                  targetId: target.personId,
                  personAName: selectedPerson.name,
                  personBName: person.name,
                });
                clearNodeSelection();
              },
            });
          }

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

      // Add Child option for erusin, nisuin, and unmarried-relations
      if (edge.type === 'erusin' || edge.type === 'nisuin' || edge.type === 'unmarried-relations') {
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

      // For erusin: option to enter nisuin
      if (edge.type === 'erusin') {
        items.push({
          label: t('enterNisuin'),
          onClick: () => updateRelationship(target.edgeId, { type: 'nisuin' }),
        });
      }

      // For erusin and nisuin: option to divorce
      if (edge.type === 'erusin' || edge.type === 'nisuin') {
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
  }, [contextMenu, resolvedState, currentSliceIndex, markPersonDead, purgePerson, removeRelationship, updateRelationship, selectedNodeIds, addRelationship, clearNodeSelection, showToast, graph.slices.length, removeSlice, openEditDescription, t]);

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

  const handleAddRelation = useCallback((type: 'unmarried-relations' | 'erusin' | 'nisuin') => {
    if (!addRelationModal.sourceId || !addRelationModal.targetId) return;

    addRelationship({
      type,
      sourceId: addRelationModal.sourceId,
      targetId: addRelationModal.targetId,
    });
  }, [addRelationship, addRelationModal.sourceId, addRelationModal.targetId]);

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

      {/* Add Relation Modal (erusin/nisuin selection) */}
      <AddRelationModal
        isOpen={addRelationModal.isOpen}
        personAName={addRelationModal.personAName}
        personBName={addRelationModal.personBName}
        onClose={() => setAddRelationModal(prev => ({ ...prev, isOpen: false }))}
        onSubmit={handleAddRelation}
      />

      {/* Edit Description Modal */}
      {editDescriptionModal && (
        <EditDescriptionModal
          currentLabel={graph.slices[editDescriptionModal.sliceIndex]?.label || ''}
          onClose={closeEditDescription}
          onSubmit={(label) => {
            updateSliceLabel(editDescriptionModal.sliceIndex, label);
            closeEditDescription();
          }}
        />
      )}

      {/* GitHub Link */}
      <a
        href="https://github.com/Nossonhuebner/yevamos-vibes"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          color: '#64748b',
          opacity: 0.7,
          transition: 'opacity 0.2s, color 0.2s',
          zIndex: 50,
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.color = '#f8fafc';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.opacity = '0.7';
          e.currentTarget.style.color = '#64748b';
        }}
        title="View on GitHub"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
      </a>

      {/* Toast Notification */}
      {toast.visible && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: toast.type === 'error' ? '#f87171' : '#34d399',
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
