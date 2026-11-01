import type { OwnedItem, OwnedPokemon, User } from '../user/user.type';

const TEST_POKEMON: OwnedPokemon[] = [
  { instanceId: 'evolution-test-bulbasaur', speciesId: 1, level: 30 },
  { instanceId: 'evolution-test-ivysaur', speciesId: 2, level: 60 },
  { instanceId: 'evolution-test-rattata', speciesId: 19, level: 30 },
  { instanceId: 'evolution-test-eevee', speciesId: 133, level: 30 },
  { instanceId: 'evolution-test-pikachu', speciesId: 25, level: 60 },
  { instanceId: 'evolution-test-nidorina', speciesId: 30, level: 60 },
];

const TEST_ITEMS: OwnedItem[] = [
  { itemId: 'water-stone', quantity: 1 },
  { itemId: 'thunder-stone', quantity: 1 },
  { itemId: 'fire-stone', quantity: 1 },
];

export function addEvolutionTestData(user: User): User | null {
  const existingIds = new Set(user.ownedPokemon.map((pokemon) => pokemon.instanceId));
  const pokemonToAdd = TEST_POKEMON.filter(
    (pokemon) => !existingIds.has(pokemon.instanceId),
  );
  if (pokemonToAdd.length === 0) {
    return null;
  }

  const shouldAddItems = !existingIds.has(TEST_POKEMON[0].instanceId);
  const ownedItems = shouldAddItems
    ? user.ownedItems.map((item) => {
        const testItem = TEST_ITEMS.find(({ itemId }) => itemId === item.itemId);
        return testItem
          ? { ...item, quantity: item.quantity + testItem.quantity }
          : item;
      })
    : [...user.ownedItems];

  if (shouldAddItems) {
    for (const testItem of TEST_ITEMS) {
      if (!ownedItems.some(({ itemId }) => itemId === testItem.itemId)) {
        ownedItems.push(testItem);
      }
    }
  }

  return {
    ...user,
    ownedPokemon: [...user.ownedPokemon, ...pokemonToAdd],
    registeredPokemonIds: [
      ...new Set([
        ...user.registeredPokemonIds,
        ...pokemonToAdd.map(({ speciesId }) => speciesId),
      ]),
    ],
    ownedItems,
  };
}
