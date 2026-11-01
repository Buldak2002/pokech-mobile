import { Image as ExpoImage } from 'expo-image';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { itemImages } from '../feature/items/item-Images';
import type { Item } from '../feature/items/item.type';

type ItemPurchaseModalProps = {
  item: Item | null;
  visible: boolean;
  availableEnergy: number;
  quantity: number;
  ownedQuantity: number;
  onChangeQuantity: (quantity: number) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ItemPurchaseModal({
  item,
  visible,
  availableEnergy,
  quantity,
  ownedQuantity,
  onChangeQuantity,
  onClose,
  onConfirm,
}: ItemPurchaseModalProps) {
  if (!item) return null;

  const maxQuantity = Math.floor(availableEnergy / item.price);
  const totalPrice = item.price * quantity;
  const canPurchase = quantity > 0 && totalPrice <= availableEnergy;

  const decreaseQuantity = () => {
    onChangeQuantity(Math.max(1, quantity - 1));
  };

  const increaseQuantity = () => {
    onChangeQuantity(Math.min(maxQuantity, quantity + 1));
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.itemRow}>
            <View style={styles.imageWell}>
              <ExpoImage
                contentFit="contain"
                source={itemImages[item.id]}
                style={styles.itemImage}
                transition={0}
              />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.price}>
                1개 · {item.price.toLocaleString('ko-KR')} 에너지
              </Text>
              <Text style={styles.balance}>
                남은 에너지 {availableEnergy.toLocaleString('ko-KR')}
              </Text>
            </View>
              {quantity > 0 && (
                <View style={[styles.quantityBadge]}>
                  <Text style={styles.quantityText}>보유 {ownedQuantity}개</Text>
                </View>
              )}
          </View>

          {maxQuantity > 0 ? (
            <View style={styles.quantityArea}>
              <Text style={styles.sectionLabel}>수량</Text>
              <View style={styles.stepper}>
                <Pressable
                  accessibilityLabel="수량 줄이기"
                  disabled={quantity <= 1}
                  onPress={decreaseQuantity}
                  style={({ pressed }) => [
                    styles.stepButton,
                    quantity <= 1 && styles.disabled,
                    pressed && styles.buttonPressed,
                  ]}>
                  <Text style={styles.stepButtonText}>−</Text>
                </Pressable>
                <Text style={styles.quantity}>{quantity}</Text>
                <Pressable
                  accessibilityLabel="수량 늘리기"
                  disabled={quantity >= maxQuantity}
                  onPress={increaseQuantity}
                  style={({ pressed }) => [
                    styles.stepButton,
                    quantity >= maxQuantity && styles.disabled,
                    pressed && styles.buttonPressed,
                  ]}>
                  <Text style={styles.stepButtonText}>＋</Text>
                </Pressable>
                <Pressable
                  onPress={() => onChangeQuantity(maxQuantity)}
                  style={({ pressed }) => [
                    styles.maxButton,
                    pressed && styles.buttonPressed,
                  ]}>
                  <Text style={styles.maxButtonText}>최대</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={styles.insufficientText}>
              이 아이템을 구매할 에너지가 부족합니다.
            </Text>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>합계</Text>
            <Text style={styles.totalPrice}>
              {totalPrice.toLocaleString('ko-KR')} 에너지
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.actionButton,
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              disabled={!canPurchase}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.actionButton,
                styles.purchaseButton,
                !canPurchase && styles.disabled,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.purchaseText}>
                {canPurchase ? '구매' : '에너지 부족'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(14, 24, 38, 0.56)',
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    padding: 20,
    borderWidth: 2,
    borderColor: '#cbd8e3',
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: '#ffffff',
    boxShadow: '0 12px 30px rgba(10, 30, 50, 0.24)',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  imageWell: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#eef4f8',
  },
  itemImage: {
    width: 62,
    height: 62,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#172c43',
    fontSize: 21,
    fontWeight: '900',
  },
  price: {
    color: '#536575',
    fontSize: 13,
    fontWeight: '700',
  },
  balance: {
    color: '#2c78b8',
    fontSize: 12,
    fontWeight: '800',
  },
  quantityArea: {
    gap: 8,
    marginTop: 22,
  },
  sectionLabel: {
    color: '#536575',
    fontSize: 12,
    fontWeight: '800',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#c9d5df',
    borderRadius: 12,
    backgroundColor: '#f5f8fa',
  },
  stepButtonText: {
    color: '#172c43',
    fontSize: 22,
    fontWeight: '800',
  },
  quantity: {
    minWidth: 48,
    textAlign: 'center',
    color: '#172c43',
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  maxButton: {
    minHeight: 42,
    justifyContent: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#eaf3fa',
  },
  maxButtonText: {
    color: '#2c78b8',
    fontSize: 12,
    fontWeight: '900',
  },
  insufficientText: {
    marginTop: 22,
    padding: 12,
    borderRadius: 12,
    color: '#a14444',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#fff0f0',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d9e2e9',
  },
  totalLabel: {
    flex: 1,
    color: '#536575',
    fontSize: 13,
    fontWeight: '700',
  },
  totalPrice: {
    color: '#172c43',
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#c9d5df',
    backgroundColor: '#ffffff',
  },
  purchaseButton: {
    backgroundColor: '#2c78b8',
  },
  cancelText: {
    color: '#536575',
    fontSize: 14,
    fontWeight: '800',
  },
  purchaseText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.38,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  quantityBadge: {
    position: 'absolute',
    top: 14,
    right: 10,
    minWidth: 48,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#2c78b8',
  },
  quantityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
});
