import type { EvolutionItemId } from '../items/item.type';
import { POKEMON_DATA } from '../pokedex/pokemon.data';
import type { EvolutionStage } from '../pokedex/pokemon.type';
import type {
  PokemonSpeciesId,
} from '../user/user.type';
import type { EvolutionRule } from './evolution.type';

type EvolutionPairKey =
  `${PokemonSpeciesId}:${PokemonSpeciesId}`;

function createPairKey(
  fromSpeciesId: PokemonSpeciesId,
  toSpeciesId: PokemonSpeciesId,
): EvolutionPairKey {
  return `${fromSpeciesId}:${toSpeciesId}`;
}

const ITEM_EVOLUTION_REQUIREMENTS: Partial<
  Record<EvolutionPairKey, EvolutionItemId>
> = {
  // 1세대 진화의 돌
  '25:26': 'thunder-stone',
  '30:31': 'moon-stone',
  '33:34': 'moon-stone',
  '35:36': 'moon-stone',
  '37:38': 'fire-stone',
  '39:40': 'moon-stone',
  '44:45': 'leaf-stone',
  '58:59': 'fire-stone',
  '61:62': 'water-stone',
  '70:71': 'leaf-stone',
  '90:91': 'water-stone',
  '102:103': 'leaf-stone',
  '120:121': 'water-stone',

  // 이브이 분기 진화
  '133:134': 'water-stone',
  '133:135': 'thunder-stone',
  '133:136': 'fire-stone',

  // 2세대에서 추가된 진화의 돌 관계
  '44:182': 'sun-stone',
  '176:468': 'shiny-stone',
  '191:192': 'sun-stone',
  '198:430': 'dusk-stone',
  '200:429': 'dusk-stone',

  // 3세대
  '271:272': 'water-stone',
  '274:275': 'leaf-stone',
  '300:301': 'moon-stone',

  // 4세대
  '281:475': 'dawn-stone',
  '315:407': 'shiny-stone',
  '361:478': 'dawn-stone',

  // 5세대
  '511:512': 'leaf-stone',
  '513:514': 'fire-stone',
  '515:516': 'water-stone',
  '517:518': 'moon-stone',
  '546:547': 'sun-stone',
  '548:549': 'sun-stone',
  '572:573': 'shiny-stone',
  '603:604': 'thunder-stone',
  '608:609': 'dusk-stone',

  // 타원돌
  '440:113': 'oval-stone',

  // 왕의징표석
  '61:186': 'kings-rock',
  '79:199': 'kings-rock',

  // 금속코트
  '95:208': 'metal-coat',
  '123:212': 'metal-coat',

  // 용의비늘
  '117:230': 'dragon-scale',

  // 폴리곤 계열
  '137:233': 'up-grade',
  '233:474': 'dubious-disc',

  // 4세대 특수 진화 도구
  '112:464': 'protector',
  '125:466': 'electirizer',
  '126:467': 'magmarizer',
  '356:477': 'reaper-cloth',
  '215:461': 'razor-claw',
  '207:472': 'razor-fang',

  // 진주몽 분기
  '366:367': 'deep-sea-tooth',
  '366:368': 'deep-sea-scale',

  // 빈티나
  '349:350': 'prism-scale',
};

function getRequiredEvolutionLevel(
  evolutionStage: EvolutionStage,
): number {
  if (evolutionStage === 0) {
    return 30;
  }

  if (evolutionStage === 1) {
    return 60;
  }

  throw new Error(
    '최종 진화 단계에서는 다음 진화를 만들 수 없습니다.',
  );
}

export const EVOLUTION_RULES: EvolutionRule[] =
  POKEMON_DATA.flatMap((targetPokemon) => {
    const fromSpeciesId = targetPokemon.evolvesFromId;

    if (fromSpeciesId === null) {
      return [];
    }

    const sourcePokemon = POKEMON_DATA.find(
      (pokemon) => pokemon.id === fromSpeciesId,
    );

    if (!sourcePokemon) {
      throw new Error(
        `진화 전 포켓몬을 찾을 수 없습니다: ${fromSpeciesId}`,
      );
    }

    const requiredItemId =
      ITEM_EVOLUTION_REQUIREMENTS[
        createPairKey(
          sourcePokemon.id,
          targetPokemon.id,
        )
      ];

    const rule: EvolutionRule = {
      fromSpeciesId: sourcePokemon.id,
      toSpeciesId: targetPokemon.id,
      method: requiredItemId ? 'item' : 'level',
      requiredLevel: getRequiredEvolutionLevel(
        sourcePokemon.evolutionStage,
      ),
      requiredItemId,
    };

    return [rule];
  });
