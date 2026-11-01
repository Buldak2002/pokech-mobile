import type {
  Ball,
  EvolutionItem,
  EvolutionItemId,
  Item,
  ItemCategory,
} from './item.type';

export const ITEM_DATA: Ball[] = [
  {
    id: 'poke-ball',
    name: '몬스터볼',
    category: 'ball',
    price: 100,
    description: '야생 포켓몬을 잡는 기본적인 몬스터볼.',
    captrueMultiplier: 1,
  },
  {
    id: 'great-ball',
    name: '슈퍼볼',
    category: 'ball',
    price: 250,
    description: '몬스터볼보다 포켓몬을 잡기 쉬운 성능 좋은 볼.',
    captrueMultiplier: 1.5,
  },
  {
    id: 'ultra-ball',
    name: '하이퍼볼',
    category: 'ball',
    price: 500,
    description: '슈퍼볼보다 포켓몬을 잡기 쉬운 고성능 볼.',
    captrueMultiplier: 2,
  },
  {
    id: 'master-ball',
    name: '마스터볼',
    category: 'ball',
    price: 3000,
    description: '야생 포켓몬을 반드시 잡을 수 있는 최고의 볼.',
    captrueMultiplier: Infinity,
  },
];

function createEvolutionItem(
  id: EvolutionItemId,
  name: string,
  category: Exclude<ItemCategory, 'ball'>,
  price: number,
  description: string,
): EvolutionItem {
  return {
    id,
    name,
    category,
    price,
    description,
  };
}

export const EVOLUTION_ITEM_DATA: EvolutionItem[] = [
  createEvolutionItem(
    'fire-stone',
    '불꽃의돌',
    'evolution-stone',
    700,
    '특정 포켓몬을 진화시키는 불꽃빛의 돌.',
  ),
  createEvolutionItem(
    'water-stone',
    '물의돌',
    'evolution-stone',
    700,
    '특정 포켓몬을 진화시키는 맑은 물빛의 돌.',
  ),
  createEvolutionItem(
    'thunder-stone',
    '천둥의돌',
    'evolution-stone',
    700,
    '특정 포켓몬을 진화시키는 번개 무늬의 돌.',
  ),
  createEvolutionItem(
    'leaf-stone',
    '리프의돌',
    'evolution-stone',
    700,
    '특정 포켓몬을 진화시키는 잎 무늬의 돌.',
  ),
  createEvolutionItem(
    'moon-stone',
    '달의돌',
    'evolution-stone',
    800,
    '특정 포켓몬을 진화시키는 밤하늘빛의 돌.',
  ),
  createEvolutionItem(
    'sun-stone',
    '태양의돌',
    'evolution-stone',
    800,
    '특정 포켓몬을 진화시키는 태양빛의 돌.',
  ),
  createEvolutionItem(
    'shiny-stone',
    '빛의돌',
    'evolution-stone',
    900,
    '특정 포켓몬을 진화시키는 눈부신 돌.',
  ),
  createEvolutionItem(
    'dusk-stone',
    '어둠의돌',
    'evolution-stone',
    900,
    '특정 포켓몬을 진화시키는 어두운 빛의 돌.',
  ),
  createEvolutionItem(
    'dawn-stone',
    '각성의돌',
    'evolution-stone',
    900,
    '특정 포켓몬을 진화시키는 눈동자 모양의 돌.',
  ),

  createEvolutionItem(
    'oval-stone',
    '타원돌',
    'special-evolution-item',
    700,
    '핑복을 진화시키는 타원형의 돌.',
  ),
  createEvolutionItem(
    'kings-rock',
    '왕의징표석',
    'special-evolution-item',
    900,
    '특정 포켓몬의 진화에 필요한 왕관 모양의 돌.',
  ),
  createEvolutionItem(
    'metal-coat',
    '금속코트',
    'special-evolution-item',
    900,
    '특정 포켓몬의 진화에 필요한 금속성 막.',
  ),
  createEvolutionItem(
    'dragon-scale',
    '용의비늘',
    'special-evolution-item',
    900,
    '특정 포켓몬의 진화에 필요한 단단한 비늘.',
  ),
  createEvolutionItem(
    'up-grade',
    '업그레이드',
    'special-evolution-item',
    1000,
    '폴리곤의 진화에 사용되는 기계 장치.',
  ),
  createEvolutionItem(
    'dubious-disc',
    '괴상한패치',
    'special-evolution-item',
    1200,
    '폴리곤2의 진화에 사용되는 수상한 장치.',
  ),
  createEvolutionItem(
    'deep-sea-tooth',
    '심해의이빨',
    'special-evolution-item',
    900,
    '진주몽의 분기 진화에 필요한 날카로운 이빨.',
  ),
  createEvolutionItem(
    'deep-sea-scale',
    '심해의비늘',
    'special-evolution-item',
    900,
    '진주몽의 분기 진화에 필요한 아름다운 비늘.',
  ),
  createEvolutionItem(
    'protector',
    '프로텍터',
    'special-evolution-item',
    1100,
    '코뿌리의 진화에 필요한 단단한 보호구.',
  ),
  createEvolutionItem(
    'electirizer',
    '에레키부스터',
    'special-evolution-item',
    1100,
    '에레브의 진화에 필요한 전기 에너지 장치.',
  ),
  createEvolutionItem(
    'magmarizer',
    '마그마부스터',
    'special-evolution-item',
    1100,
    '마그마의 진화에 필요한 열에너지 장치.',
  ),
  createEvolutionItem(
    'reaper-cloth',
    '영계의천',
    'special-evolution-item',
    1100,
    '미라몽의 진화에 필요한 기묘한 천.',
  ),
  createEvolutionItem(
    'razor-claw',
    '예리한손톱',
    'special-evolution-item',
    900,
    '포푸니의 진화에 필요한 날카로운 손톱.',
  ),
  createEvolutionItem(
    'razor-fang',
    '예리한이빨',
    'special-evolution-item',
    900,
    '글라이거의 진화에 필요한 날카로운 이빨.',
  ),
  createEvolutionItem(
    'prism-scale',
    '고운비늘',
    'special-evolution-item',
    1000,
    '빈티나의 진화에 필요한 무지갯빛 비늘.',
  ),
];

export const ALL_ITEM_DATA: Item[] = [
  ...ITEM_DATA,
  ...EVOLUTION_ITEM_DATA,
];

export function findItemById(
  itemId: Item['id'],
): Item | undefined {
  return ALL_ITEM_DATA.find(
    (item) => item.id === itemId,
  );
}
