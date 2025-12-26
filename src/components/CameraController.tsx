import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGraphStore } from '@/store/graphStore';

interface CameraControllerProps {
  sliceSpacing: number;
}

export function CameraController({ sliceSpacing }: CameraControllerProps) {
  const { camera } = useThree();
  const viewMode = useGraphStore((state) => state.viewMode);
  const currentSliceIndex = useGraphStore((state) => state.currentSliceIndex);

  // Target position for Focus mode camera
  const targetPosition = useRef(new THREE.Vector3(0, 10, 45));
  // Target lookAt point
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  // Store original position when entering Focus mode
  const overviewPosition = useRef(new THREE.Vector3(0, 10, 45));
  // Track if we just switched modes
  const lastViewMode = useRef<'overview' | 'focus'>('overview');

  const FOCUS_CAMERA_OFFSET = 20; // Distance from slice to camera in Focus mode
  const FOCUS_CAMERA_Y = 5; // Lower Y position in Focus mode for closer view

  // Update target position when slice changes or mode changes
  useEffect(() => {
    if (viewMode === 'focus') {
      // Store current position if just entering Focus mode
      if (lastViewMode.current === 'overview') {
        overviewPosition.current.copy(camera.position);
      }

      // Calculate target: camera looks at slice from front
      const sliceZ = currentSliceIndex * sliceSpacing;
      targetPosition.current.set(0, FOCUS_CAMERA_Y, sliceZ + FOCUS_CAMERA_OFFSET);
      targetLookAt.current.set(0, 0, sliceZ);
    } else {
      // Returning to Overview mode - restore original position
      targetPosition.current.copy(overviewPosition.current);
      targetLookAt.current.set(0, 0, 0);
    }

    lastViewMode.current = viewMode;
  }, [viewMode, currentSliceIndex, sliceSpacing, camera]);

  // Animate camera position
  useFrame(() => {
    if (viewMode === 'focus') {
      // Lerp camera position toward target (smooth animation)
      camera.position.lerp(targetPosition.current, 0.08);

      // Make camera look at the current slice center
      const currentLookAt = new THREE.Vector3();
      camera.getWorldDirection(currentLookAt);
      currentLookAt.multiplyScalar(10).add(camera.position);
      currentLookAt.lerp(targetLookAt.current, 0.08);
      camera.lookAt(targetLookAt.current);
    }
    // In Overview mode, OrbitControls handles the camera
  });

  return null; // No visual output - just controls camera
}
