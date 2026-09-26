import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_DEX_NUMBER = 649;
const CONCURRENCY = 12;
const ROOT = process.cwd();

const destinations = {
  png: path.join(ROOT, "assets", "pokemon", "pokeapi", "front"),
  aniFemale: path.join(ROOT, "assets", "pokemon", "showdown", "female"),
  gen5: path.join(ROOT, "assets", "pokemon", "showdown", "gen5", "front"),
  gen5Female: path.join(
    ROOT,
    "assets",
    "pokemon",
    "showdown",
    "gen5",
    "female",
  ),
};

for (const directory of Object.values(destinations)) {
  await mkdir(directory, { recursive: true });
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "poketch-asset-downloader/1.0" },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function download(url, destination) {
  const contents = await fetchBuffer(url);
  if (!contents) return false;

  await writeFile(destination, contents);
  return true;
}

const pokedexResponse = await fetch(
  "https://play.pokemonshowdown.com/data/pokedex.json",
);
if (!pokedexResponse.ok) {
  throw new Error(`Could not load Showdown Pokédex: ${pokedexResponse.status}`);
}

const pokedex = await pokedexResponse.json();
const showdownIds = new Map();

for (const [showdownId, pokemon] of Object.entries(pokedex)) {
  const number = pokemon.num;
  if (
    Number.isInteger(number) &&
    number >= 1 &&
    number <= MAX_DEX_NUMBER &&
    !pokemon.baseSpecies &&
    !showdownIds.has(number)
  ) {
    showdownIds.set(number, showdownId);
  }
}

if (showdownIds.size !== MAX_DEX_NUMBER) {
  const missing = Array.from({ length: MAX_DEX_NUMBER }, (_, index) => index + 1)
    .filter((number) => !showdownIds.has(number));
  throw new Error(`Missing Showdown IDs: ${missing.join(", ")}`);
}

const jobs = [];
for (let number = 1; number <= MAX_DEX_NUMBER; number += 1) {
  const showdownId = showdownIds.get(number);

  jobs.push({
    kind: "png",
    url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${number}.png`,
    destination: path.join(destinations.png, `${number}.png`),
  });
  jobs.push({
    kind: "aniFemale",
    url: `https://play.pokemonshowdown.com/sprites/ani/${showdownId}-f.gif`,
    destination: path.join(destinations.aniFemale, `${number}.gif`),
  });
  jobs.push({
    kind: "gen5",
    url: `https://play.pokemonshowdown.com/sprites/gen5ani/${showdownId}.gif`,
    destination: path.join(destinations.gen5, `${number}.gif`),
  });
  jobs.push({
    kind: "gen5Female",
    url: `https://play.pokemonshowdown.com/sprites/gen5ani/${showdownId}-f.gif`,
    destination: path.join(destinations.gen5Female, `${number}.gif`),
  });
}

const counts = Object.fromEntries(
  Object.keys(destinations).map((kind) => [kind, { downloaded: 0, missing: 0 }]),
);
let cursor = 0;

async function worker() {
  while (cursor < jobs.length) {
    const job = jobs[cursor];
    cursor += 1;

    const downloaded = await download(job.url, job.destination);
    counts[job.kind][downloaded ? "downloaded" : "missing"] += 1;
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

console.log(JSON.stringify(counts, null, 2));
