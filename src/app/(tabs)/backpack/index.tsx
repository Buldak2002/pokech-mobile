import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BagMenuSprite, MenuIcon } from '../../../components/bag-ui';

const menus = [
  {
    id: 'pokemon',
    label: '포켓몬',
    color: '#658ca5',
    route: '/backpack/party',
  },
  {
    id: 'pokedex',
    label: '도감',
    color: '#c8616b',
    route: '/backpack/pokedex',
  },
  {
    id: 'items',
    label: '지닌 물건',
    color: '#328af0',
    route: '/backpack/items',
  },
  {
    id: 'settings',
    label: '설정',
    color: '#608c7b',
    route: '/backpack/settings',
  },
] as const;

export default function BackpackScreen() {
  const [height, setHeight] = useState(600);
  const compact = height < 620;

  return (
    <View
      style={styles.screen}
      onLayout={({ nativeEvent }) => setHeight(nativeEvent.layout.height)}
    >
      <View style={styles.hero}>
        <View style={styles.heading}>
          <Text style={styles.title}>가방</Text>
          <Text style={styles.subtitle}>모험에 필요한 모든 것</Text>
        </View>
        <View style={styles.preview}>
          <View pointerEvents="none" style={styles.watermark}>
            <View style={styles.watermarkLine} />
            <View style={styles.watermarkCenter} />
          </View>
          <MenuIcon name="items" size={compact ? 76 : 104} />
        </View>
        <Text style={styles.description}>도구와 포켓몬을 확인하세요.</Text>
      </View>
      <View style={styles.menuGrid}>
        {[menus.slice(0, 2), menus.slice(2)].map((row, index) => (
          <View key={index} style={styles.row}>
            {row.map((menu) => (
              <Pressable
                key={menu.id}
                accessibilityRole="button"
                accessibilityLabel={menu.label + ' 열기'}
                onPress={() => router.push(menu.route)}
                style={({ pressed }) => [
                  styles.card,
                  { borderColor: menu.color },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  pointerEvents="none"
                  style={[styles.inset, { borderColor: menu.color }]}
                />
                <View
                  pointerEvents="none"
                  style={[styles.corner, { backgroundColor: menu.color }]}
                />
                <BagMenuSprite name={menu.id} compact={compact} />
                <Text style={styles.label}>{menu.label}</Text>
                <Text style={[styles.arrow, { color: menu.color }]}>›</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingBottom: 16, backgroundColor: '#fff' },
  hero: {
    flex: 0.46,
    minHeight: 0,
    padding: 18,
    backgroundColor: '#f0f5f8',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heading: { gap: 4 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#657481' },
  preview: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: '#e3ebf0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkLine: {
    width: 140,
    height: 7,
    backgroundColor: '#e3ebf0',
    position: 'absolute',
  },
  watermarkCenter: {
    width: 42,
    height: 42,
    borderWidth: 7,
    borderRadius: 21,
    borderColor: '#e3ebf0',
    backgroundColor: '#f0f5f8',
  },
  description: { textAlign: 'center', fontSize: 13, color: '#526476' },
  menuGrid: {
    flex: 0.54,
    minHeight: 0,
    gap: 12,
    padding: 16,
    paddingBottom: 0,
  },
  row: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    padding: 8,
    overflow: 'hidden',
  },
  inset: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    right: 3,
    borderWidth: 1,
    borderRadius: 8,
    opacity: 0.5,
  },
  corner: { position: 'absolute', width: 24, height: 5, top: 4, left: 7 },
  label: { fontSize: 17, fontWeight: '800', color: '#111827' },
  arrow: { position: 'absolute', right: 12, bottom: 12, fontSize: 24 },
  pressed: { opacity: 0.65, backgroundColor: '#e6eff7' },
});
