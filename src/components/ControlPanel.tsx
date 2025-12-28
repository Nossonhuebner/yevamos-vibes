import { useState } from 'react';
import { useGraphStore, useCurrentResolvedState, useCurrentSlice } from '@/store/graphStore';
import { getNodesArray, getEdgesArray, isPersonDead } from '@/utils/deltaResolver';
import { RelationshipType, RELATIONSHIP_LABELS, RELATIONSHIP_STYLES, Person } from '@/types';

// Relationship types that can be created between two people
const COUPLE_RELATIONSHIP_TYPES: RelationshipType[] = ['erusin', 'nisuin', 'divorce', 'yibum', 'chalitzah', 'unmarried-relations'];

export function ControlPanel() {
  const resolvedState = useCurrentResolvedState();
  const currentSlice = useCurrentSlice();
  const graph = useGraphStore((state) => state.graph);
  const currentSliceIndex = useGraphStore((state) => state.currentSliceIndex);
  const selectedNodeIds = useGraphStore((state) => state.selectedNodeIds);
  const selectedEdgeId = useGraphStore((state) => state.selectedEdgeId);

  const updatePersonName = useGraphStore((state) => state.updatePersonName);
  const addRelationship = useGraphStore((state) => state.addRelationship);
  const addChildToRelationship = useGraphStore((state) => state.addChildToRelationship);
  const toggleNodeSelection = useGraphStore((state) => state.toggleNodeSelection);
  const clearNodeSelection = useGraphStore((state) => state.clearNodeSelection);
  const selectEdge = useGraphStore((state) => state.selectEdge);
  const updateSliceLabel = useGraphStore((state) => state.updateSliceLabel);
  const removeSlice = useGraphStore((state) => state.removeSlice);
  const updateMetadata = useGraphStore((state) => state.updateMetadata);

  const [newEdgeType, setNewEdgeType] = useState<RelationshipType>('nisuin');
  const [newChildName, setNewChildName] = useState('');
  const [newChildGender, setNewChildGender] = useState<'male' | 'female'>('male');

  const nodes = getNodesArray(resolvedState);
  const edges = getEdgesArray(resolvedState);

  // Get selected nodes
  const selectedNodes: Person[] = selectedNodeIds
    .map((id) => resolvedState.nodes.get(id))
    .filter((n): n is Person => n !== undefined);

  const selectedEdge = selectedEdgeId ? resolvedState.edges.get(selectedEdgeId) : null;

  // Check if we have a valid couple selection (1 male + 1 female)
  const hasCoupleSelection = selectedNodes.length === 2 &&
    selectedNodes.some((n) => n.gender === 'male') &&
    selectedNodes.some((n) => n.gender === 'female');

  const handleAddRelationship = () => {
    if (selectedNodes.length === 2) {
      addRelationship({
        type: newEdgeType,
        sourceId: selectedNodes[0].id,
        targetId: selectedNodes[1].id,
      });
      clearNodeSelection();
    }
  };

  const handleAddChild = () => {
    if (selectedEdgeId && newChildName.trim()) {
      addChildToRelationship(selectedEdgeId, {
        name: newChildName.trim(),
        gender: newChildGender,
        position: { x: 0, y: 0 }, // Will be overridden
      });
      setNewChildName('');
    }
  };

  const canAddChild = selectedEdge &&
    (selectedEdge.type === 'erusin' || selectedEdge.type === 'nisuin' || selectedEdge.type === 'unmarried-relations');

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h2>{graph.metadata.title}</h2>
        <input
          type="text"
          value={graph.metadata.title}
          onChange={(e) => updateMetadata({ title: e.target.value })}
          style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: 'inherit', width: '100%' }}
        />
      </div>

      {/* Current Slice Info */}
      <div className="panel-section">
        <h3>Current Slice</h3>
        <div className="form-group">
          <label>Label</label>
          <input
            type="text"
            value={currentSlice?.label || ''}
            onChange={(e) => updateSliceLabel(currentSliceIndex, e.target.value)}
          />
        </div>
        <p style={{ color: '#64748b', fontSize: '11px', marginBottom: '8px' }}>
          Right-click on slice to add people
        </p>
        {graph.slices.length > 1 && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => removeSlice(currentSliceIndex)}
          >
            Delete Slice
          </button>
        )}
      </div>

      {/* Create Relationship - shown when 2 nodes selected (1 male + 1 female) */}
      {hasCoupleSelection && (
        <div className="panel-section">
          <h3>Create Relationship</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '12px' }}>
            {selectedNodes[0].name} & {selectedNodes[1].name}
          </p>
          <div className="form-group">
            <label>Relationship Type</label>
            <select
              value={newEdgeType}
              onChange={(e) => setNewEdgeType(e.target.value as RelationshipType)}
            >
              {COUPLE_RELATIONSHIP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {RELATIONSHIP_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary btn-block" onClick={handleAddRelationship}>
            Create Relationship
          </button>
          <button
            className="btn btn-secondary btn-block"
            onClick={clearNodeSelection}
            style={{ marginTop: '8px' }}
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Single node selected */}
      {selectedNodes.length === 1 && (
        <div className="panel-section">
          <h3>Selected: {selectedNodes[0].name}</h3>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={selectedNodes[0].name}
              onChange={(e) => updatePersonName(selectedNodes[0].id, e.target.value)}
            />
          </div>
          <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px' }}>
            Select another person to create a relationship
          </p>
          <p style={{ color: '#64748b', fontSize: '11px' }}>
            Right-click for more options
          </p>
        </div>
      )}

      {/* Selected Edge */}
      {selectedEdge && (
        <div className="panel-section">
          <h3>Selected Relationship</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            {resolvedState.nodes.get(selectedEdge.sourceId)?.name} &{' '}
            {resolvedState.nodes.get(selectedEdge.targetId)?.name}
          </p>
          <p style={{ marginBottom: '12px' }}>
            <span
              className="relationship-badge"
              style={{ backgroundColor: RELATIONSHIP_STYLES[selectedEdge.type].color }}
            >
              {RELATIONSHIP_LABELS[selectedEdge.type]}
            </span>
          </p>

          {/* Add child - only for marriage or unmarried-relations */}
          {canAddChild && (
            <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #475569' }}>
              <h4 style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Add Child</h4>
              <div className="form-group">
                <label>Child Name</label>
                <input
                  type="text"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select
                  value={newChildGender}
                  onChange={(e) => setNewChildGender(e.target.value as 'male' | 'female')}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <button
                className="btn btn-primary btn-block"
                onClick={handleAddChild}
                disabled={!newChildName.trim()}
              >
                Add Child
              </button>
            </div>
          )}

          <p style={{ color: '#64748b', fontSize: '11px', marginTop: '12px' }}>
            Right-click for more options
          </p>
        </div>
      )}

      {/* Node List */}
      <div className="panel-content">
        <h3 style={{ marginBottom: '12px', color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase' }}>
          People ({nodes.length})
        </h3>
        <div className="item-list">
          {nodes.length === 0 ? (
            <div className="empty-state">
              <p>No people yet</p>
              <p style={{ fontSize: '11px', color: '#64748b' }}>Right-click on slice to add</p>
            </div>
          ) : (
            nodes.map((node) => {
              const isDead = isPersonDead(node, currentSliceIndex);
              const isSelected = selectedNodeIds.includes(node.id);
              return (
                <div
                  key={node.id}
                  className={`item-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleNodeSelection(node.id)}
                  style={{ opacity: isDead ? 0.5 : 1 }}
                >
                  <div className="item-card-header">
                    <span
                      className="item-card-title"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          backgroundColor: isDead ? '#6b7280' : node.color,
                          color: '#fff',
                          fontSize: '12px',
                          opacity: isDead ? 0.5 : 1,
                        }}
                      >
                        {isDead ? '✝' : (node.gender === 'male' ? '♂' : '♀')}
                      </span>
                      {node.name}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <h3 style={{ marginTop: '24px', marginBottom: '12px', color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase' }}>
          Relationships ({edges.length})
        </h3>
        <div className="item-list">
          {edges.length === 0 ? (
            <div className="empty-state">
              <p>No relationships yet</p>
            </div>
          ) : (
            edges.map((edge) => {
              const source = resolvedState.nodes.get(edge.sourceId);
              const target = resolvedState.nodes.get(edge.targetId);
              if (!source || !target) return null;

              return (
                <div
                  key={edge.id}
                  className={`item-card ${selectedEdgeId === edge.id ? 'selected' : ''}`}
                  onClick={() => selectEdge(edge.id)}
                >
                  <div className="item-card-header">
                    <span className="item-card-title">
                      {source.name} & {target.name}
                    </span>
                  </div>
                  <span
                    className="relationship-badge"
                    style={{ backgroundColor: RELATIONSHIP_STYLES[edge.type].color }}
                  >
                    {RELATIONSHIP_LABELS[edge.type]}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
