import { ITEM_DATA } from './item-data';
import type { Ball, BallName } from './item.type';
import type { User } from '../user/user.type';

export type AvailableBall = {
  ball: Ball;
  quantity: number;
};

export function getFirstAvailableBall(
  user: User,
): AvailableBall | null {
  const ownedItems = user.ownedItems ?? [];

  for (const ball of ITEM_DATA) {
    const ownedItem = ownedItems.find(
      item => item.itemId === ball.id,
    );

    if (ownedItem && ownedItem.quantity > 0) {
      return {
        ball,
        quantity: ownedItem.quantity,
      };
    }
  }

  return null;
}

export function consumeBall(
  user: User,
  ballId: BallName,
): User {
  const ownedItems = user.ownedItems ?? [];
  const ownedBall = ownedItems.find(
    item => item.itemId === ballId,
  );

  if (!ownedBall || ownedBall.quantity <= 0) {
    throw new Error('사용할 수 있는 볼이 없습니다.');
  }

  return {
    ...user,
    ownedItems: ownedItems.map(item =>
      item.itemId === ballId
        ? {
            ...item,
            quantity: item.quantity - 1,
          }
        : item,
    ),
  };
}
