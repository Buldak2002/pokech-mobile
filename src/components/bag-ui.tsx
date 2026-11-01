import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

export const bagColors = {
  ink: '#111827',
  muted: '#657481',
  paper: '#ffffff',
  grid: '#ffffff',
  line: '#bbcbd3',
  frame: '#637b88',
  red: '#ef4444',
  blue: '#328af0',
};

export const menuAssets = {
  home: require('../../assets/items/poke-ball.png'),
  pokemon: require('../../assets/items/poke-ball.png'),
  pokedex: require('../../assets/items/pokedex.png'),
  market: require('../../assets/items/pokemon-center.png'),
  items: require('../../assets/items/backpag.webp'),
  settings: require('../../assets/items/settings-gear.svg'),
};

export type MenuIconName = keyof typeof menuAssets;

// Visible sprite bounds, excluding transparent padding in the original assets.
const spriteBounds = {
  pokemon: { canvas: 30, x: 6, y: 6, width: 18, height: 18 },
  pokedex: { canvas: 1254, x: 279, y: 296, width: 714, height: 718 },
  items: { canvas: 58, x: 0, y: 0, width: 58, height: 58 },
  settings: { canvas: 32, x: 1, y: 1, width: 30, height: 30 },
};

export function BagMenuSprite({
  name,
  compact = false,
}: {
  name: keyof typeof spriteBounds;
  compact?: boolean;
}) {
  const size = compact ? 28 : 34;
  const bounds = spriteBounds[name];
  const scale = size / Math.max(bounds.width, bounds.height);

  return (
    <View
      style={{
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: size, height: size, overflow: 'hidden' }}>
        <Image
          source={menuAssets[name]}
          contentFit="contain"
          transition={0}
          style={{
            position: 'absolute',
            width: bounds.canvas * scale,
            height: bounds.canvas * scale,
            left: (size - bounds.width * scale) / 2 - bounds.x * scale,
            top: (size - bounds.height * scale) / 2 - bounds.y * scale,
          }}
        />
      </View>
    </View>
  );
}

export function MenuIcon({
  name,
  size = 48,
}: {
  name: MenuIconName;
  size?: number;
}) {
  // The supplied Pokédex art has generous transparent margins; keep the original asset.
  const scale =
    name === 'market'
      ? 1.65
      : name === 'pokedex'
        ? 1.5
        : name === 'home' || name === 'pokemon'
          ? 1.3
          : 1;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={menuAssets[name]}
        contentFit="contain"
        transition={0}
        style={{ width: size * scale, height: size * scale }}
      />
    </View>
  );
}

export const svgSource = (body: string) => ({
  uri: `data:image/svg+xml;utf8,${encodeURIComponent(body)}`,
});
const grid = svgSource(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><defs><pattern id="g" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" stroke="#dce6eb" stroke-width="0.6"/></pattern></defs><rect width="100%" height="100%" fill="#edf3f5"/><rect width="100%" height="100%" fill="url(#g)"/></svg>',
);

export function GridPanel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.panel, style]}>
      <Image source={grid} contentFit="cover" style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.inset} />
      {children}
    </View>
  );
}

export function FolderFrame({
  color,
  selected,
}: {
  color: string;
  selected: boolean;
}) {
  return (
    <Image
      pointerEvents="none"
      contentFit="fill"
      style={StyleSheet.absoluteFill}
      source={svgSource(
        `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="100" viewBox="0 0 180 100" preserveAspectRatio="none"><path d="M3 3H67L80 15H177V97H3Z" fill="#ffffff" stroke="${selected ? '#328af0' : '#637b88'}" stroke-width="3"/><path d="M8 8H65L78 20H172V92H8Z" fill="${selected ? '#d2e7ff' : '#e8eef1'}" stroke="${color}" stroke-width="2"/><path d="M10 10H64L77 22H170V31H10Z" fill="${color}"/><path d="M10 31H58L94 90H10Z" fill="${color}" opacity="0.23"/></svg>`,
      )}
    />
  );
}

const styles = StyleSheet.create({
  iconFrame: {
    width: 48,
    height: 48,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 6,
    backgroundColor: '#f5f9fb',
    boxShadow: '2px 2px 0 #9bacb6',
  },
  iconFrameInset: {
    position: 'absolute',
    top: 2,
    right: 2,
    bottom: 2,
    left: 2,
    borderWidth: 1,
    borderColor: '#d3dfe5',
    borderRadius: 2,
  },
  panel: {
    borderWidth: 2,
    borderColor: bagColors.frame,
    backgroundColor: bagColors.grid,
  },
  inset: {
    position: 'absolute',
    top: 3,
    right: 3,
    bottom: 3,
    left: 3,
    borderWidth: 1,
    borderColor: bagColors.line,
  },
});
