export type BallName =
  | 'poke-ball'
  | 'great-ball'
  | 'ultra-ball'
  | 'master-ball';

export type EvolutionStoneId =
  | 'dawn-stone'
  | 'dusk-stone'
  | 'fire-stone'
  | 'leaf-stone'
  | 'moon-stone'
  | 'shiny-stone'
  | 'sun-stone'
  | 'thunder-stone'
  | 'water-stone';

export type SpecialEvolutionItemId =
  | 'deep-sea-scale'
  | 'deep-sea-tooth'
  | 'dragon-scale'
  | 'dubious-disc'
  | 'electirizer'
  | 'kings-rock'
  | 'magmarizer'
  | 'metal-coat'
  | 'oval-stone'
  | 'prism-scale'
  | 'protector'
  | 'razor-claw'
  | 'razor-fang'
  | 'reaper-cloth'
  | 'up-grade';

export type EvolutionItemId =
  | EvolutionStoneId
  | SpecialEvolutionItemId;

export type ItemId =
  | BallName
  | EvolutionItemId;

export type ItemCategory =
  | 'ball'
  | 'evolution-stone'
  | 'special-evolution-item';

type BaseItem<
  TId extends ItemId,
  TCategory extends ItemCategory,
> = {
  id: TId;
  name: string;
  category: TCategory;
  price: number;
  description: string;
};

export type Ball = BaseItem<BallName, 'ball'> & {
  captrueMultiplier: number;
};

export type EvolutionItem = BaseItem<
  EvolutionItemId,
  'evolution-stone' | 'special-evolution-item'
>;

export type Item =
  | Ball
  | EvolutionItem;