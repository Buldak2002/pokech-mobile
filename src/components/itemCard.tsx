import { memo } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { itemImages } from '../feature/items/item-Images';
import type {
  BallName,
  Item,
  ItemCategory,
} from '../feature/items/item.type';

type ItemCardProps = {
  item: Item;
  ownedQuantity: number;
  onPress: () => void;
  width: number;
};

type ItemTheme = {
  accent: string;
  tint: string;
  border: string;
};

const ballTheme: Record<BallName, ItemTheme> = {
  'poke-ball': {
    accent: '#e54b4b',
    tint: '#fff0f0',
    border: '#efb5b5',
  },
  'great-ball': {
    accent: '#3e7ec9',
    tint: '#edf5ff',
    border: '#afcbea',
  },
  'ultra-ball': {
    accent: '#d49a18',
    tint: '#fff7dc',
    border: '#e8cf87',
  },
  'master-ball': {
    accent: '#8b5bc2',
    tint: '#f7efff',
    border: '#ceb4ea',
  },
};

const categoryTheme: Record<
  Exclude<ItemCategory, 'ball'>,
  ItemTheme
> = {
  'evolution-stone': {
    accent: '#d98717',
    tint: '#fff6dc',
    border: '#ebc779',
  },
  'special-evolution-item': {
    accent: '#7257b8',
    tint: '#f4efff',
    border: '#c8b9ea',
  },
};

function formatMultiplier(multiplier: number) {
  return multiplier === Infinity ? '필중' : `×${multiplier}`;
}

const ItemCard = memo(function ItemCard({
  item,
  ownedQuantity,
  onPress,
  width,
}: ItemCardProps) {
  const theme = item.category === 'ball'
    ? ballTheme[item.id]
    : categoryTheme[item.category];
  const detailLabel = item.category === 'ball'
    ? '포획 보정'
    : '아이템 분류';
  const detailValue = item.category === 'ball'
    ? formatMultiplier(item.captrueMultiplier)
    : item.category === 'evolution-stone'
      ? '진화의 돌'
      : '특수 진화 도구';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.price} 에너지, 구매창 열기`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { borderColor: theme.border, width },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />

      <View style={[styles.imageWell, { backgroundColor: theme.tint }]}>
        <View style={[styles.imageRing, { borderColor: theme.border }]} />
        <ExpoImage
          accessibilityLabel={`${item.name} 이미지`}
          source={itemImages[item.id]}
          contentFit="contain"
          transition={0}
          style={styles.itemImage}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={[styles.multiplierBadge, { backgroundColor: theme.tint }]}>
          <Text style={styles.multiplierLabel}>{detailLabel}</Text>
          <Text style={[styles.multiplierValue, { color: theme.accent }]}>
            {detailValue}
          </Text>
        </View>
        <Text style={styles.ownedQuantity}>보유 {ownedQuantity}개</Text>
      </View>

      <View style={styles.priceRow}>
        <View style={[styles.pointMark, { backgroundColor: theme.accent }]}>
          <Text style={styles.pointMarkText}>E</Text>
        </View>
        <Text style={styles.priceLabel}>에너지</Text>
        <Text style={styles.itemPrice}>{item.price.toLocaleString('ko-KR')} E</Text>
      </View>
    </Pressable>
  );
});

export default ItemCard;

const styles = StyleSheet.create({
  container: {
    minWidth: 0,
    minHeight: 300,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: '#ffffff',
    boxShadow: '0 3px 10px rgba(31, 48, 61, 0.12)',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  accentBar: {
    height: 5,
  },
  imageWell: {
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  imageRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderWidth: 1,
    borderRadius: 38,
    backgroundColor: '#ffffffb8',
  },
  itemImage: {
    width: 76,
    height: 76,
  },
  info: {
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
  },
  itemName: {
    color: '#172c43',
    fontSize: 16,
    fontWeight: '900',
  },
  multiplierBadge: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  multiplierLabel: {
    color: '#70808e',
    fontSize: 10,
    fontWeight: '700',
  },
  multiplierValue: {
    fontSize: 11,
    fontWeight: '900',
  },
  ownedQuantity: {
    color: '#526476',
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  priceRow: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    borderTopWidth: 1,
    borderTopColor: '#e5ebef',
    backgroundColor: '#f8fafb',
  },
  pointMark: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  pointMarkText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  priceLabel: {
    flex: 1,
    marginLeft: 6,
    color: '#7b8995',
    fontSize: 11,
    fontWeight: '700',
  },
  itemPrice: {
    color: '#172c43',
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
});
