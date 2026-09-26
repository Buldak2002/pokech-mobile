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

const response = await fetch(SPECIES_NAMES_URL);
if (!response.ok) {
  throw new Error(`Could not load Pokémon names: ${response.status}`);
}

const koreanNames = new Map();
const csv = await response.text();

for (const line of csv.split(/\r?\n/).slice(1)) {
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
    const name = JSON.stringify(koreanNames.get(number));

    return `  { id: ${number}, name: ${name}, image: POKEMON_IMAGES[${number}] },`;
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
