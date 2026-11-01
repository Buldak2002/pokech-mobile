import { appStorage } from '../../storage/appStorage';
import type {
  PokemonInstanceId,
  PokemonSpeciesId,
  User,
} from '../user/user.type';
import { evolvePokemon } from './evolution.rules';

export async function commitEvolution(
  pokemonId: PokemonInstanceId,
  toSpeciesId: PokemonSpeciesId,
): Promise<User> {
  const latestSave = await appStorage.loadGame();
  if (!latestSave) {
    throw new Error('저장 데이터를 찾을 수 없습니다.');
  }

  const nextUser = evolvePokemon(
    latestSave.user,
    pokemonId,
    toSpeciesId,
  );
  await appStorage.saveGame({ ...latestSave, user: nextUser });
  return nextUser;
}
