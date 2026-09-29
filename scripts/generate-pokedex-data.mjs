import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_DEX_NUMBER = 649;
const KOREAN_LANGUAGE_ID = '3';
const ROOT = process.cwd();
const IMAGE_DIRECTORY = path.join(
  ROOT,
  'assets',
  'pokemon',
  'pokeapi',
  'front',
);
const OUTPUT_DIRECTORY = path.join(ROOT, 'src', 'feature', 'pokedex');
const SPECIES_NAMES_URL =
  'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv';

const POKEMON_SPECIES_URL =
  'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species.csv';

const POKEMON_TYPES_URL =
  'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_types.csv';

const TYPES_URL =
  'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/types.csv';

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += character;
    }
  }

  values.push(value);
  return values;
}

async function fetchCsv(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Could not load CSV: ${response.status} ${url}`,
    );
  }

  return response.text();
}

function parseCsvRecords(csv) {
  const [headerLine, ...lines] = csv.split(/\r?\n/);
  const headers = parseCsvLine(headerLine);

  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);

    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? '']),
    );
  });
}

const imageFiles = await readdir(IMAGE_DIRECTORY);
const availableNumbers = new Set(
  imageFiles
    .filter((fileName) => /^\d+\.png$/.test(fileName))
    .map((fileName) => Number.parseInt(path.basename(fileName, '.png'), 10)),
);

const missingImages = Array.from(
  { length: MAX_DEX_NUMBER },
  (_, index) => index + 1,
).filter((number) => !availableNumbers.has(number));

if (missingImages.length > 0) {
  throw new Error(`Missing Pokédex images: ${missingImages.join(', ')}`);
}

const [
  speciesNamesCsv,
  pokemonSpeciesCsv,
  pokemonTypesCsv,
  typesCsv,
] = await Promise.all([
  fetchCsv(SPECIES_NAMES_URL),
  fetchCsv(POKEMON_SPECIES_URL),
  fetchCsv(POKEMON_TYPES_URL),
  fetchCsv(TYPES_URL),
]);

const koreanNames = new Map();

for (
  const line of speciesNamesCsv
    .split(/\r?\n/)
    .slice(1)
) {
  if (!line) continue;

  const [speciesId, languageId, name] = parseCsvLine(line);
  const number = Number.parseInt(speciesId, 10);

  if (
    languageId === KOREAN_LANGUAGE_ID &&
    number >= 1 &&
    number <= MAX_DEX_NUMBER
  ) {
    koreanNames.set(number, name);
  }
}

const missingNames = Array.from(
  { length: MAX_DEX_NUMBER },
  (_, index) => index + 1,
).filter((number) => !koreanNames.has(number));

if (missingNames.length > 0) {
  throw new Error(`Missing Korean Pokémon names: ${missingNames.join(', ')}`);
}

const speciesMetadataByPokemonId = new Map();
const pokemonIdsWithNextEvolution = new Set();

for (const record of parseCsvRecords(pokemonSpeciesCsv)) {
  const pokemonId = Number.parseInt(record.id, 10);

  if (pokemonId < 1 || pokemonId > MAX_DEX_NUMBER) {
    continue;
  }

  const evolvesFromId = record.evolves_from_species_id
    ? Number.parseInt(record.evolves_from_species_id, 10)
    : null;

  speciesMetadataByPokemonId.set(pokemonId, {
    evolvesFromId,
    captureRate: Number.parseInt(record.capture_rate, 10),
    isLegendary: record.is_legendary === '1',
    isMythical: record.is_mythical === '1',
  });

  if (
    evolvesFromId !== null &&
    evolvesFromId <= MAX_DEX_NUMBER
  ) {
    pokemonIdsWithNextEvolution.add(evolvesFromId);
  }
}

const getEvolutionStage = (pokemonId) => {
  let evolutionStage = 0;
  let currentPokemonId = pokemonId;
  const visitedPokemonIds = new Set();

  while (true) {
    if (visitedPokemonIds.has(currentPokemonId)) {
      throw new Error(`Circular evolution chain: ${pokemonId}`);
    }

    visitedPokemonIds.add(currentPokemonId);

    const metadata = speciesMetadataByPokemonId.get(currentPokemonId);

    if (!metadata) {
      throw new Error(`Missing species metadata: ${currentPokemonId}`);
    }

    if (metadata.evolvesFromId === null) {
      return evolutionStage;
    }

    evolutionStage += 1;
    currentPokemonId = metadata.evolvesFromId;
  }
};

const typeNameById = new Map();

for (const line of typesCsv.split(/\r?\n/).slice(1)) {
  if (!line) continue;

  const [typeIdValue, typeName] =
    parseCsvLine(line);

  const typeId = Number.parseInt(typeIdValue, 10);

  if (typeId >= 1 && typeId <= 18) {
    typeNameById.set(typeId, typeName);
  }
}

const typesByPokemonId = new Map();

for (
  const line of pokemonTypesCsv
    .split(/\r?\n/)
    .slice(1)
) {
  if (!line) continue;

  const [
    pokemonIdValue,
    typeIdValue,
    slotValue,
  ] = parseCsvLine(line);

  const pokemonId = Number.parseInt(
    pokemonIdValue,
    10,
  );

  const typeId = Number.parseInt(
    typeIdValue,
    10,
  );

  const slot = Number.parseInt(
    slotValue,
    10,
  );

  if (
    pokemonId < 1 ||
    pokemonId > MAX_DEX_NUMBER
  ) {
    continue;
  }

  const typeName = typeNameById.get(typeId);

  if (!typeName) {
    continue;
  }

  const existingTypes =
    typesByPokemonId.get(pokemonId) ?? [];

  existingTypes.push({
    slot,
    name: typeName,
  });

  typesByPokemonId.set(
    pokemonId,
    existingTypes,
  );
}

const imageLines = Array.from(
  { length: MAX_DEX_NUMBER },
  (_, index) => {
    const number = index + 1;
    return `  ${number}: require('../../../assets/pokemon/pokeapi/front/${number}.png'),`;
  },
);

const imageModule = `import type { ImageSourcePropType } from 'react-native';

export const POKEMON_IMAGES: Record<number, ImageSourcePropType> = {
${imageLines.join('\n')}
};
`;

const dataLines = Array.from(
  { length: MAX_DEX_NUMBER },
  (_, index) => {
    const number = index + 1;

    const name = JSON.stringify(
      koreanNames.get(number),
    );

    const types = (
      typesByPokemonId.get(number) ?? []
    )
      .sort((left, right) => left.slot - right.slot)
      .map((entry) => entry.name);

    if (types.length === 0) {
      throw new Error(
        `Missing Pokémon types: ${number}`,
      );
    }

    const serializedTypes =
      JSON.stringify(types);

    const metadata =
      speciesMetadataByPokemonId.get(number);

    if (!metadata) {
      throw new Error(
        `Missing species metadata: ${number}`,
      );
    }

    const evolutionStage =
      getEvolutionStage(number);

    if (evolutionStage > 2) {
      throw new Error(
        `Unsupported evolution stage: ${number}`,
      );
    }

    const hasNextEvolution =
      pokemonIdsWithNextEvolution.has(number);

    const isFinalEvolution =
      metadata.evolvesFromId !== null &&
      !hasNextEvolution;

    return `  { id: ${number}, name: ${name}, image: POKEMON_IMAGES[${number}], types: ${serializedTypes}, evolvesFromId: ${metadata.evolvesFromId}, evolutionStage: ${evolutionStage}, hasNextEvolution: ${hasNextEvolution}, isFinalEvolution: ${isFinalEvolution}, captureRate: ${metadata.captureRate}, isLegendary: ${metadata.isLegendary}, isMythical: ${metadata.isMythical} },`;
  },
);

const dataModule = `import { POKEMON_IMAGES } from './pokemonImages';
import type { Pokemon } from './pokemon.type';

export const POKEMON_DATA: Pokemon[] = [
${dataLines.join('\n')}
];
`;

await Promise.all([
  writeFile(path.join(OUTPUT_DIRECTORY, 'pokemonImages.ts'), imageModule),
  writeFile(path.join(OUTPUT_DIRECTORY, 'pokemon.data.ts'), dataModule),
]);

console.log(`Generated ${MAX_DEX_NUMBER} Pokédex entries.`);
