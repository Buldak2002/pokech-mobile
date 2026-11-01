import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import ItemPurchaseModal from '../../components/item-purchase-modal';
import ItemCard from '../../components/itemCard';
import { ALL_ITEM_DATA } from '../../feature/items/item-data';
import type {
  Item,
  ItemCategory,
  ItemId,
} from '../../feature/items/item.type';
import { useStepEnergy } from '../../hooks/use-step-energy';
import { appStorage } from '../../storage/appStorage';

type PurchasedItems = Partial<Record<ItemId, number>>;

type CategoryTab = {
  id: ItemCategory;
  label: string;
  description: string;
};

const CATEGORY_TABS: CategoryTab[] = [
  {
    id: 'ball',
    label: '몬스터볼',
    description: '탐험에서 만난 포켓몬을 포획해 보세요.',
  },
  {
    id: 'evolution-stone',
    label: '진화의 돌',
    description: '특별한 빛을 지닌 돌로 진화를 준비하세요.',
  },
  {
    id: 'special-evolution-item',
    label: '특수 도구',
    description: '특정 포켓몬의 진화에 필요한 희귀한 도구예요.',
  },
];

const CARD_GAP = 14;

export default function Market() {
  const { width: screenWidth } = useWindowDimensions();
  const { energy } = useStepEnergy();

  const [category, setCategory] = useState<ItemCategory>('ball');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [availableEnergy, setAvailableEnergy] = useState(0);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItems>({});
  const [isPurchasing, setIsPurchasing] = useState(false);

  const cardWidth = Math.min(
    280,
    Math.max(220, screenWidth - 76),
  );

  const visibleItems = useMemo(
    () => ALL_ITEM_DATA.filter((item) => item.category === category),
    [category],
  );

  const activeCategory = CATEGORY_TABS.find(
    (tab) => tab.id === category,
  ) ?? CATEGORY_TABS[0];

  useEffect(() => {
    let cancelled = false;

    async function syncEnergyBalance() {
      await Promise.resolve();

      if (!cancelled) {
        setAvailableEnergy(energy);
      }
    }

    void syncEnergyBalance();

    return () => {
      cancelled = true;
    };
  }, [energy]);

  useEffect(() => {
    let cancelled = false;

    async function loadPurchasedItems() {
      const save = await appStorage.loadGame();

      if (!save || cancelled) return;

      const itemQuantities = save.user.ownedItems.reduce<PurchasedItems>(
        (result, ownedItem) => {
          result[ownedItem.itemId] =
            (result[ownedItem.itemId] ?? 0) + ownedItem.quantity;

          return result;
        },
        {},
      );

      setAvailableEnergy(save.user.energy ?? 0);
      setPurchasedItems(itemQuantities);
    }

    void loadPurchasedItems();

    return () => {
      cancelled = true;
    };
  }, []);

  const openPurchaseModal = (item: Item) => {
    const maxQuantity = Math.floor(availableEnergy / item.price);

    setSelectedItem(item);
    setQuantity(maxQuantity > 0 ? 1 : 0);
  };

  const closePurchaseModal = () => {
    setSelectedItem(null);
    setQuantity(1);
  };

  const confirmPurchase = async () => {
    if (!selectedItem || quantity < 1 || isPurchasing) return;

    setIsPurchasing(true);

    try {
      const latestSave = await appStorage.loadGame();

      if (!latestSave) {
        Alert.alert('구매 실패', '저장 데이터를 찾을 수 없습니다.');
        return;
      }

      const currentEnergy = latestSave.user.energy ?? 0;
      const totalPrice = selectedItem.price * quantity;

      if (totalPrice > currentEnergy) {
        setAvailableEnergy(currentEnergy);
        Alert.alert(
          '에너지 부족',
          '현재 에너지로는 해당 수량을 구매할 수 없습니다.',
        );
        return;
      }

      const existingItem = latestSave.user.ownedItems.find(
        (ownedItem) => ownedItem.itemId === selectedItem.id,
      );

      const nextOwnedItems = existingItem
        ? latestSave.user.ownedItems.map((ownedItem) =>
            ownedItem.itemId === selectedItem.id
              ? {
                  ...ownedItem,
                  quantity: ownedItem.quantity + quantity,
                }
              : ownedItem,
          )
        : [
            ...latestSave.user.ownedItems,
            {
              itemId: selectedItem.id,
              quantity,
            },
          ];

      const nextEnergy = currentEnergy - totalPrice;

      await appStorage.saveGame({
        ...latestSave,
        user: {
          ...latestSave.user,
          energy: nextEnergy,
          ownedItems: nextOwnedItems,
        },
      });

      setAvailableEnergy(nextEnergy);
      setPurchasedItems((current) => ({
        ...current,
        [selectedItem.id]:
          (current[selectedItem.id] ?? 0) + quantity,
      }));

      closePurchaseModal();
    } catch (error) {
      console.error('아이템 구매 저장 실패:', error);
      Alert.alert(
        '구매 실패',
        '아이템을 저장하지 못했습니다. 다시 시도해주세요.',
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>POKÉMON CENTER</Text>
          <Text style={styles.title}>포켓몬 상점</Text>
        </View>
        <View style={styles.energyBox}>
          <Text style={styles.energyLabel}>ENERGY</Text>
          <Text style={styles.energyValue}>
            {availableEnergy.toLocaleString('ko-KR')}
          </Text>
        </View>
      </View>

      <View style={styles.categoryTabs}>
        {CATEGORY_TABS.map((tab) => {
          const isActive = tab.id === category;

          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => setCategory(tab.id)}
              style={({ pressed }) => [
                styles.categoryTab,
                isActive && styles.activeCategoryTab,
                pressed && styles.pressedCategoryTab,
              ]}>
              <Text
                numberOfLines={1}
                style={[
                  styles.categoryText,
                  isActive && styles.activeCategoryText,
                ]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeading}>
        <View style={styles.sectionHeadingText}>
          <Text style={styles.sectionTitle}>{activeCategory.label}</Text>
          <Text style={styles.sectionDescription} numberOfLines={2}>
            {activeCategory.description}
          </Text>
        </View>
        <View style={styles.swipeHint}>
          <Text style={styles.swipeHintText}>좌우로 밀기</Text>
          <Text style={styles.swipeArrow}>→</Text>
        </View>
      </View>

      <FlatList
        key={category}
        contentContainerStyle={styles.carouselContent}
        contentInsetAdjustmentBehavior="automatic"
        data={visibleItems}
        decelerationRate="fast"
        disableIntervalMomentum
        extraData={purchasedItems}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => openPurchaseModal(item)}
            ownedQuantity={purchasedItems[item.id] ?? 0}
            width={cardWidth}
          />
        )}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={cardWidth + CARD_GAP}
        style={styles.carousel}
      />

      <View style={styles.footerNote}>
        <Text style={styles.footerNoteTitle}>걷고, 모으고, 진화하세요</Text>
        <Text style={styles.footerNoteText}>
          100걸음마다 10에너지가 적립돼요. 구매한 아이템은 가방에 바로 보관됩니다.
        </Text>
      </View>

      <ItemPurchaseModal
        availableEnergy={availableEnergy}
        item={selectedItem}
        onChangeQuantity={setQuantity}
        onClose={closePurchaseModal}
        onConfirm={confirmPurchase}
        ownedQuantity={
          selectedItem
            ? purchasedItems[selectedItem.id] ?? 0
            : 0
        }
        quantity={quantity}
        visible={selectedItem !== null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 18,
    backgroundColor: '#eef3f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  headingText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.7,
  },
  title: {
    marginTop: 2,
    color: '#172c43',
    fontSize: 28,
    fontWeight: '900',
  },
  energyBox: {
    minWidth: 96,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#cbd8e3',
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: '#ffffff',
    boxShadow: '0 3px 10px rgba(31, 48, 61, 0.12)',
  },
  energyLabel: {
    color: '#7b8995',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  energyValue: {
    marginTop: 2,
    color: '#172c43',
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  categoryTabs: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 20,
    marginTop: 18,
    padding: 5,
    borderWidth: 1,
    borderColor: '#d3dee7',
    borderRadius: 15,
    borderCurve: 'continuous',
    backgroundColor: '#e3ebf1',
  },
  categoryTab: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: 11,
    borderCurve: 'continuous',
  },
  activeCategoryTab: {
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 6px rgba(31, 48, 61, 0.14)',
  },
  pressedCategoryTab: {
    opacity: 0.72,
  },
  categoryText: {
    color: '#667888',
    fontSize: 12,
    fontWeight: '800',
  },
  activeCategoryText: {
    color: '#172c43',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeadingText: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    color: '#172c43',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionDescription: {
    marginTop: 3,
    color: '#71808d',
    fontSize: 12,
    lineHeight: 17,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 2,
  },
  swipeHintText: {
    color: '#8795a1',
    fontSize: 10,
    fontWeight: '800',
  },
  swipeArrow: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '900',
  },
  carousel: {
    flexGrow: 0,
    marginTop: 14,
  },
  carouselContent: {
    gap: CARD_GAP,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  footerNote: {
    marginHorizontal: 20,
    marginTop: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: '#d3dee7',
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: '#f8fafc',
  },
  footerNoteTitle: {
    color: '#172c43',
    fontSize: 13,
    fontWeight: '900',
  },
  footerNoteText: {
    marginTop: 4,
    color: '#71808d',
    fontSize: 11,
    lineHeight: 16,
  },
});
