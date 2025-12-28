import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useGraphStore } from '@/store/graphStore';
import { TimeSlicePlane } from './TimeSlicePlane';
import { CrossSliceEdges } from './CrossSliceEdges';
import { SelectionBoxHandler } from './SelectionBoxHandler';
import { CameraController } from './CameraController';
import { HalachicOverlay } from './HalachicOverlay';

export function Scene() {
  const slices = useGraphStore((state) => state.graph.slices);
  const resolvedStates = useGraphStore((state) => state.resolvedStates);
  const currentSliceIndex = useGraphStore((state) => state.currentSliceIndex);
  const isDraggingNode = useGraphStore((state) => state.isDraggingNode);
  const selectionBox = useGraphStore((state) => state.selectionBox);
  const isDraggingSelection = useGraphStore((state) => state.isDraggingSelection);
  const viewMode = useGraphStore((state) => state.viewMode);

  const SLICE_SPACING = 5; // Distance between slices along Z-axis (time axis)

  // Disable orbit controls during node drag, selection box drag, or selection bounds drag
  const controlsEnabled = !isDraggingNode && !selectionBox && !isDraggingSelection;
  // Disable rotation in Focus mode (camera is animated)
  const enableRotate = viewMode === 'overview';

  return (
    <Canvas
      camera={{ position: [0, 10, 45], fov: 50 }}
      style={{
        background: '#0f172a',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      <OrbitControls
        enabled={controlsEnabled}
        enablePan={true}
        enableZoom={true}
        enableRotate={enableRotate}
        minDistance={5}
        maxDistance={150}
      />

      {/* Camera controller for Focus mode animations */}
      <CameraController sliceSpacing={SLICE_SPACING} />

      {/* Handle selection box node hit-testing */}
      <SelectionBoxHandler />

      {/* Render each time slice as a vertical 2D plane */}
      {slices.map((slice, index) => (
        <TimeSlicePlane
          key={slice.id}
          slice={slice}
          sliceIndex={index}
          resolvedState={resolvedStates[index]}
          zPosition={index * SLICE_SPACING}
          isCurrentSlice={index === currentSliceIndex}
        />
      ))}

      {/* Cross-slice edges showing node continuity */}
      <CrossSliceEdges
        resolvedStates={resolvedStates}
        sliceSpacing={SLICE_SPACING}
      />

      {/* Halachic overlay (status lines when halacha mode is active) */}
      <HalachicOverlay sliceSpacing={SLICE_SPACING} />

      {/* Reference grid on ground plane */}
      <Grid
        position={[0, -0.01, 0]}
        args={[40, 40]}
        cellSize={2}
        cellThickness={0.5}
        cellColor="#1e293b"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#334155"
        fadeDistance={80}
        infiniteGrid
      />

    </Canvas>
  );
}
