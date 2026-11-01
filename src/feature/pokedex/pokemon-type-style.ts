import type { PokemonType } from './pokemon.type';

type PokemonTypeStyle = {
  label: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

export const POKEMON_TYPE_STYLES: Record<PokemonType, PokemonTypeStyle> = {
  normal: {
    label: '노말',
    backgroundColor: '#A8A77A',
    borderColor: '#85845F',
    textColor: '#1F2937',
  },
  fighting: {
    label: '격투',
    backgroundColor: '#C22E28',
    borderColor: '#92231F',
    textColor: '#FFFFFF',
  },
  flying: {
    label: '비행',
    backgroundColor: '#A98FF3',
    borderColor: '#806BC0',
    textColor: '#f2f0f7',
  },
  poison: {
    label: '독',
    backgroundColor: '#A33EA1',
    borderColor: '#792E78',
    textColor: '#FFFFFF',
  },
  ground: {
    label: '땅',
    backgroundColor: '#E2BF65',
    borderColor: '#B2944B',
    textColor: '#352B14',
  },
  rock: {
    label: '바위',
    backgroundColor: '#B6A136',
    borderColor: '#887828',
    textColor: '#FFFFFF',
  },
  bug: {
    label: '벌레',
    backgroundColor: '#A6B91A',
    borderColor: '#7A8913',
    textColor: '#263000',
  },
  ghost: {
    label: '고스트',
    backgroundColor: '#735797',
    borderColor: '#55406F',
    textColor: '#FFFFFF',
  },
  steel: {
    label: '강철',
    backgroundColor: '#B7B7CE',
    borderColor: '#8B8BA5',
    textColor: '#252533',
  },
  fire: {
    label: '불꽃',
    backgroundColor: '#EE8130',
    borderColor: '#B85F20',
    textColor: '#FFFFFF',
  },
  water: {
    label: '물',
    backgroundColor: '#6390F0',
    borderColor: '#466DBD',
    textColor: '#FFFFFF',
  },
  grass: {
    label: '풀',
    backgroundColor: '#7AC74C',
    borderColor: '#579735',
    textColor: '#19330F',
  },
  electric: {
    label: '전기',
    backgroundColor: '#F7D02C',
    borderColor: '#C6A51D',
    textColor: '#382F00',
  },
  psychic: {
    label: '에스퍼',
    backgroundColor: '#F95587',
    borderColor: '#C33D68',
    textColor: '#FFFFFF',
  },
  ice: {
    label: '얼음',
    backgroundColor: '#96D9D6',
    borderColor: '#69AAA7',
    textColor: '#173937',
  },
  dragon: {
    label: '드래곤',
    backgroundColor: '#6F35FC',
    borderColor: '#5123C2',
    textColor: '#FFFFFF',
  },
  dark: {
    label: '악',
    backgroundColor: '#705746',
    borderColor: '#4E3C31',
    textColor: '#FFFFFF',
  },
  fairy: {
    label: '페어리',
    backgroundColor: '#D685AD',
    borderColor: '#A85F83',
    textColor: '#3D172A',
  },
};
