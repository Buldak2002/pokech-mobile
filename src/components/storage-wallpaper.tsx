import { useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

// Render a viewport onto the user's original atlas without resampling/editing it.
export function StorageWallpaper({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: ReactNode;
}) {
  const [size, setSize] = useState({ width: 1, height: 1 });
  return (
    <View
      style={styles.frame}
      onLayout={({ nativeEvent }) => setSize(nativeEvent.layout)}
    >
      <Image
        source={require('../../assets/images/box-backgrounds.png')}
        contentFit="fill"
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: (692 * size.width) / 168,
          height: (1060 * size.height) / 142,
          left: (-x * size.width) / 168,
          top: (-y * size.height) / 142,
        }}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#91aab4',
    backgroundColor: '#dce8df',
    boxShadow: '0 3px 8px rgba(35, 58, 70, 0.18)',
  },
});
