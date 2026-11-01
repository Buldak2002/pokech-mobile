import { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BagPageHeading } from '../../../components/bag-page-heading';
import { BagLoadState } from '../../../components/bag-load-state';
import { EmptyPokeball } from '../../../components/empty-pokeball';
import { useBagSave } from '../../../hooks/use-bag-save';
import {
  findItemById,
} from '../../../feature/items/item-data';
import { itemImages } from '../../../feature/items/item-Images';
import type { ItemId } from '../../../feature/items/item.type';

export default function ItemsScreen() {
  const { save, loading, error, retry } = useBagSave();
  const [category, setCategory] = useState<'balls' | 'tools'>('balls');
  const [selectedId, setSelectedId] = useState<ItemId | null>(null);
  const owned = (save?.user.ownedItems ?? []).filter(
    (item) => item.quantity > 0,
  );
  const items = owned.filter((ownedItem) => {
    const item = findItemById(ownedItem.itemId);

    return category === 'balls'
      ? item?.category === 'ball'
      : item?.category !== 'ball';
  });
  const selected = items.find((item) => item.itemId === selectedId) ?? items[0];
  const data = selected ? findItemById(selected.itemId) : undefined;

  if (loading || error)
    return <BagLoadState loading={loading} error={error} retry={retry} />;

  return (
    <View style={styles.screen}>
      <BagPageHeading title="지닌 물건" />
      <View style={styles.categories}>
        {(
          [
            { id: 'balls', label: '몬스터볼' },
            { id: 'tools', label: '도구' },
          ] as const
        ).map((tab) => (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: category === tab.id }}
            onPress={() => {
              setCategory(tab.id);
              setSelectedId(null);
            }}
            style={[
              styles.category,
              category === tab.id && styles.activeCategory,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                category === tab.id && styles.activeText,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: 4 }, (_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: 4 }, (_, column) => {
              const item = items[row * 4 + column];
              return (
                <Pressable
                  key={column}
                  disabled={!item}
                  accessibilityRole="button"
                  accessibilityLabel={
                    item
                      ? (findItemById(item.itemId)?.name ?? item.itemId) +
                        ' ' +
                        item.quantity +
                        '개'
                      : '빈 슬롯'
                  }
                  accessibilityState={{
                    disabled: !item,
                    selected: !!item && item.itemId === selected?.itemId,
                  }}
                  onPress={() => item && setSelectedId(item.itemId)}
                  style={[
                    styles.slot,
                    !!item &&
                      item.itemId === selected?.itemId &&
                      styles.selected,
                  ]}
                >
                  {item ? (
                    <>
                      <Image
                        source={itemImages[item.itemId]}
                        contentFit="contain"
                        style={styles.sprite}
                      />
                      <Text style={styles.quantity}>×{item.quantity}</Text>
                    </>
                  ) : (
                    <EmptyPokeball />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <View style={styles.detail}>
        {selected && data ? (
          <>
            <View style={styles.detailHeading}>
              <Image
                source={itemImages[selected.itemId]}
                contentFit="contain"
                style={styles.detailSprite}
              />
              <View style={{ gap: 4 }}>
                <Text style={styles.name}>{data.name}</Text>
                <Text style={styles.detailText}>
                  보유 <Text style={styles.count}>{selected.quantity}개</Text>
                </Text>
              </View>
            </View>
            <Text style={styles.detailText}>
              {data.description}
            </Text>
          </>
        ) : (
          <Text style={styles.detailText}>
            {category === 'tools'
              ? '아직 보유한 도구가 없어요.'
              : '보유한 몬스터볼이 없어요. 상점에서 확인해 보세요.'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  categories: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#c6d2de',
    borderRadius: 8,
    marginBottom: 14,
    overflow: 'hidden',
  },
  category: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf2f7',
  },
  activeCategory: { backgroundColor: '#ef4444' },
  categoryText: { color: '#657481', fontSize: 15, fontWeight: '700' },
  activeText: { color: '#fff' },
  grid: { flex: 1, minHeight: 180, gap: 8 },
  row: { flex: 1, flexDirection: 'row', gap: 8 },
  slot: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf2f7',
    borderWidth: 1,
    borderColor: '#ced9e3',
    borderRadius: 9,
  },
  selected: {
    borderWidth: 2,
    borderColor: '#32adf2',
    backgroundColor: '#e6f4fc',
  },
  sprite: { width: 46, height: 46, maxWidth: '75%', maxHeight: '75%' },
  quantity: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#172c43',
  },
  detail: {
    marginTop: 14,
    minHeight: 112,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#c6d2de',
    borderRadius: 9,
    backgroundColor: '#f5f8fb',
    justifyContent: 'center',
  },
  detailHeading: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  detailSprite: { width: 48, height: 48 },
  name: { color: '#172c43', fontSize: 18, fontWeight: '800' },
  detailText: { color: '#526476', fontSize: 13, lineHeight: 19 },
  count: { color: '#ef4444', fontWeight: '800' },
});
