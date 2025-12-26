import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { getEmojiTexture, getCachedEmojiTexture } from '@/utils/emojiTextures';

interface EmojiSpriteProps {
  emoji: string;
  position: [number, number, number];
  size?: number;
  opacity?: number;
}

export function EmojiSprite({ emoji, position, size = 0.4, opacity = 1 }: EmojiSpriteProps) {
  const [texture, setTexture] = useState<THREE.Texture | undefined>(
    getCachedEmojiTexture(emoji)
  );

  useEffect(() => {
    // If not cached, load it
    if (!texture) {
      getEmojiTexture(emoji).then(setTexture);
    }
  }, [emoji, texture]);

  if (!texture) {
    // Return nothing while loading
    return null;
  }

  // Use a plane mesh instead of sprite so it stays fixed in the scene
  // (sprites always face camera which causes visual issues)
  return (
    <mesh position={position}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
