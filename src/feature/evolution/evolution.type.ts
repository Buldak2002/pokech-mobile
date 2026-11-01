import type { EvolutionItemId } from '../items/item.type';
import type {
  PokemonSpeciesId,
} from '../user/user.type';

export type EvolutionMethod = 'level' | 'item';

export type EvolutionRule = {
  fromSpeciesId: PokemonSpeciesId;
  toSpeciesId: PokemonSpeciesId;
  method: EvolutionMethod;
  requiredLevel: number;
  requiredItemId?: EvolutionItemId;
};
