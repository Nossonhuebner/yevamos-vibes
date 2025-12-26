import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { ResolvedGraphState } from '@/types';

interface CrossSliceEdgesProps {
  resolvedStates: ResolvedGraphState[];
  sliceSpacing: number;
}

export function CrossSliceEdges({ resolvedStates, sliceSpacing }: CrossSliceEdgesProps) {
  // Calculate connections between same nodes across vertical slices (along Z-axis)
  const connections = useMemo(() => {
    const result: {
      nodeId: string;
      points: THREE.Vector3[];
      color: string;
    }[] = [];

    // Collect all unique node IDs across all slices
    const allNodeIds = new Set<string>();
    for (const state of resolvedStates) {
      for (const nodeId of state.nodes.keys()) {
        allNodeIds.add(nodeId);
      }
    }

    // For each node, trace its path through time (along Z-axis)
    for (const nodeId of allNodeIds) {
      const points: THREE.Vector3[] = [];

      for (let i = 0; i < resolvedStates.length; i++) {
        const state = resolvedStates[i];
        const node = state.nodes.get(nodeId);

        if (node) {
          // Position: x, y on the vertical plane, z = slice position along time axis
          const z = i * sliceSpacing;
          points.push(new THREE.Vector3(node.position.x, node.position.y, z + 0.1));
        } else if (points.length > 0) {
          // Node was removed - stop tracing
          break;
        }
      }

      if (points.length > 1) {
        // Get color based on first occurrence
        const firstState = resolvedStates.find((s) => s.nodes.has(nodeId));
        const gender = firstState?.nodes.get(nodeId)?.gender;
        const color = gender === 'male' ? '#3b82f6' : '#ec4899';

        result.push({ nodeId, points, color });
      }
    }

    return result;
  }, [resolvedStates, sliceSpacing]);

  return (
    <group>
      {connections.map(({ nodeId, points, color }) => (
        <Line
          key={`cross-${nodeId}`}
          points={points}
          color={color}
          lineWidth={1}
          transparent
          opacity={0.3}
          dashed
          dashSize={0.3}
          gapSize={0.15}
        />
      ))}
    </group>
  );
}
