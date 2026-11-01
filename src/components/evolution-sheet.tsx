import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { BottomSheet, RNHostView } from '@expo/ui';
import { Image } from 'expo-image';

import { addEvolutionTestData } from '../feature/evolution/evolution.debug-data';
import { commitEvolution } from '../feature/evolution/commit-evolution';
import { getLevelEligibleEvolutions } from '../feature/evolution/evolution.rules';
import { findItemById } from '../feature/items/item-data';
import { POKEMON_DATA } from '../feature/pokedex/pokemon.data';
import type {
  PokemonInstanceId,
  PokemonSpeciesId,
  User,
} from '../feature/user/user.type';
import { appStorage } from '../storage/appStorage';
import { pokeballColors } from '../theme/colors';
import { router } from 'expo-router';

type EvolutionSheetProps = {
  isOpen: boolean;
  user: User | null;
  onDismiss: () => void;
  onUserChange: (user: User) => void;
};

const pokemonById = new Map(POKEMON_DATA.map((pokemon) => [pokemon.id, pokemon]));

function getPokemonName(speciesId: PokemonSpeciesId): string {
  return pokemonById.get(speciesId)?.name
    ?? '알 수 없는 포켓몬';
}

export function EvolutionSheet({
  isOpen,
  user,
  onDismiss,
  onUserChange,
}: EvolutionSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [selectedEvolution, setSelectedEvolution] = useState<{
    pokemonId: PokemonInstanceId;
    toSpeciesId: PokemonSpeciesId;
  } | null>(null);
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolutionNotice, setEvolutionNotice] = useState<string | null>(null);
  const evolutionSavingRef = useRef(false);
  const testDataSavingRef = useRef(false);

  const levelEligibleEvolutions = useMemo(
    () => user ? getLevelEligibleEvolutions(user) : [],
    [user],
  );
  const selectedEvolutionOption = selectedEvolution
    ? levelEligibleEvolutions.find(
        ({ pokemon, rule }) =>
          pokemon.instanceId === selectedEvolution.pokemonId &&
          rule.toSpeciesId === selectedEvolution.toSpeciesId,
      )
    : undefined;
  const selectedRequiredItemId = selectedEvolutionOption?.rule.requiredItemId;
  const selectedItemQuantity = selectedRequiredItemId
    ? user?.ownedItems.find((item) => item.itemId === selectedRequiredItemId)?.quantity ?? 0
    : 0;
  const selectedCanEvolve = Boolean(
    selectedEvolutionOption &&
    (!selectedRequiredItemId || selectedItemQuantity > 0),
  );

  const handleDismiss = () => {
    setSelectedEvolution(null);
    setEvolutionNotice(null);
    onDismiss();
  };

  const handleAddTestData = async () => {
    if (testDataSavingRef.current || evolutionSavingRef.current) return;
    testDataSavingRef.current = true;

    try {
      const latestSave = await appStorage.loadGame();
      if (!latestSave) {
        throw new Error('저장 데이터를 찾을 수 없습니다.');
      }

      const nextUser = addEvolutionTestData(latestSave.user);
      if (!nextUser) {
        setEvolutionNotice('테스트 데이터가 이미 추가되어 있어요.');
        return;
      }

      await appStorage.saveGame({ ...latestSave, user: nextUser });
      onUserChange(nextUser);
      setSelectedEvolution(null);
      setEvolutionNotice('진화 테스트 데이터를 추가했어요.');
    } catch (error) {
      Alert.alert(
        '테스트 데이터 추가 실패',
        error instanceof Error ? error.message : '다시 시도해주세요.',
      );
    } finally {
      testDataSavingRef.current = false;
    }
  };

  const handleApplyEvolution = async () => {
    if (
      !selectedEvolutionOption ||
      !selectedCanEvolve ||
      evolutionSavingRef.current ||
      testDataSavingRef.current
    ) {
      return;
    }

    const { pokemon, rule } = selectedEvolutionOption;
    evolutionSavingRef.current = true;
    setIsEvolving(true);

    try {
      const nextUser = await commitEvolution(
        pokemon.instanceId,
        rule.toSpeciesId,
      );
      onUserChange(nextUser);
      setSelectedEvolution(null);
      setEvolutionNotice(
        `${getPokemonName(pokemon.speciesId)} → ${getPokemonName(rule.toSpeciesId)} 진화 완료!`,
      );
      router.replace({
        pathname: '/evolution-animation',
        params: {
          fromSpeciesId: String(pokemon.speciesId),
          toSpeciesId: String(rule.toSpeciesId),
          instanceId: pokemon.speciesId
        }
      })
    } catch (error) {
      Alert.alert(
        '진화 실패',
        error instanceof Error ? error.message : '다시 시도해주세요.',
      );
    } finally {
      evolutionSavingRef.current = false;
      setIsEvolving(false);
    }
  };

  return (
    <BottomSheet
      isPresented={isOpen}
      onDismiss={handleDismiss}
      snapPoints={['full']}
    >
      <RNHostView>
        <View
          style={[
            styles.evolutionSheet,
            { height: Math.min(windowHeight * 0.84, 1000) },
          ]}
        >
          <Text style={styles.evolutionSheetTitle}>진화 가능 포켓몬</Text>
          {__DEV__ && (
            <Pressable
              accessibilityRole="button"
              onPress={() => void handleAddTestData()}
              style={styles.evolutionTestButton}
            >
              <Text style={styles.evolutionTestButtonText}>
                진화 테스트 데이터 추가
              </Text>
            </Pressable>
          )}
          {evolutionNotice && (
            <Text style={styles.evolutionNotice}>{evolutionNotice}</Text>
          )}
          <FlatList
            style={styles.evolutionList}
            data={levelEligibleEvolutions}
            keyExtractor={({ pokemon, rule }) =>
              `${pokemon.instanceId}:${rule.toSpeciesId}`
            }
            contentContainerStyle={styles.evolutionListContent}
            ListEmptyComponent={
              <Text style={styles.evolutionEmptyText}>
                진화 레벨에 도달한 포켓몬이 없어요.
              </Text>
            }
            renderItem={({ item: { pokemon, rule } }) => {
              const currentPokemon = pokemonById.get(pokemon.speciesId);
              const nextPokemon = pokemonById.get(rule.toSpeciesId);
              const currentName = currentPokemon?.name ?? '알 수 없는 포켓몬';
              const nextName = nextPokemon?.name ?? '알 수 없는 포켓몬';
              const itemName = rule.requiredItemId
                ? findItemById(rule.requiredItemId)?.name
                : null;
              const itemQuantity = rule.requiredItemId
                ? user?.ownedItems.find((item) => item.itemId === rule.requiredItemId)?.quantity ?? 0
                : 0;
              const canEvolve = !rule.requiredItemId || itemQuantity > 0;
              const isSelected =
                selectedEvolution?.pokemonId === pokemon.instanceId &&
                selectedEvolution.toSpeciesId === rule.toSpeciesId;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${currentName}, 레벨 ${pokemon.level}, ${nextName}(으)로 진화 후보${itemName ? `, ${itemName} 필요, 보유 ${itemQuantity}개` : ''}`}
                  accessibilityState={{ selected: isSelected, disabled: isEvolving }}
                  disabled={isEvolving}
                  onPress={() => {
                    setSelectedEvolution({
                      pokemonId: pokemon.instanceId,
                      toSpeciesId: rule.toSpeciesId,
                    });
                    setEvolutionNotice(null);
                  }}
                  style={[
                    styles.evolutionListRow,
                    isSelected && styles.evolutionListRowSelected,
                  ]}
                >
                  <View style={styles.evolutionRowMain}>
                    <View style={styles.evolutionPortrait}>
                      {currentPokemon && (
                        <Image
                          source={currentPokemon.image}
                          contentFit="contain"
                          style={styles.evolutionSprite}
                        />
                      )}
                    </View>
                    <Text style={styles.evolutionArrow}>→</Text>
                    <View style={[styles.evolutionPortrait, styles.evolutionSilhouetteFrame]}>
                      {nextPokemon && (
                        <Image
                          source={nextPokemon.image}
                          contentFit="contain"
                          tintColor={pokeballColors.black}
                          style={styles.evolutionSprite}
                        />
                      )}
                    </View>
                    <View style={styles.evolutionRowNames}>
                      <Text style={styles.evolutionListName}>{currentName}</Text>
                      <Text style={styles.evolutionListName}>→ {nextName}</Text>
                      <Text style={styles.evolutionListDetail}>
                        Lv. {pokemon.level} · 필요 Lv. {rule.requiredLevel}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.evolutionRowFooter}>
                    <Text style={[
                      styles.evolutionRequirement,
                      !canEvolve && styles.evolutionRequirementMissing,
                    ]}>
                      {itemName
                        ? `${itemName} 필요 · 보유 ${itemQuantity}개`
                        : '레벨 조건 충족'}
                    </Text>
                    <Text style={[
                      styles.evolutionStatus,
                      !canEvolve && styles.evolutionStatusMissing,
                    ]}>
                      {canEvolve ? '진화 가능' : '아이템 부족'}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
          {selectedEvolutionOption && (
            <View style={styles.evolutionPreview}>
              <Text style={styles.evolutionPreviewTitle}>
                {getPokemonName(selectedEvolutionOption.pokemon.speciesId)} →{' '}
                {getPokemonName(selectedEvolutionOption.rule.toSpeciesId)}
              </Text>
              <Text style={styles.evolutionListDetail}>
                Lv. {selectedEvolutionOption.pokemon.level} 포켓몬을 진화시킬까요?
                {selectedRequiredItemId
                  ? selectedCanEvolve
                    ? ` ${findItemById(selectedRequiredItemId)?.name ?? '진화 아이템'} 1개가 사용됩니다.`
                    : ` ${findItemById(selectedRequiredItemId)?.name ?? '진화 아이템'} 1개가 필요합니다. 현재 ${selectedItemQuantity}개 보유 중입니다.`
                  : ''}
              </Text>
              <View style={styles.evolutionPreviewActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isEvolving}
                  onPress={() => setSelectedEvolution(null)}
                  style={styles.evolutionCancelButton}
                >
                  <Text style={styles.evolutionCancelText}>취소</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isEvolving || !selectedCanEvolve }}
                  disabled={isEvolving || !selectedCanEvolve}
                  onPress={() => void handleApplyEvolution()}
                  style={[
                    styles.evolutionConfirmButton,
                    (isEvolving || !selectedCanEvolve) && styles.evolutionConfirmButtonDisabled,
                  ]}
                >
                  <Text style={styles.evolutionConfirmText}>
                    {isEvolving ? '진화 중...' : selectedCanEvolve ? '진화시키기' : '아이템 부족'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </RNHostView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  evolutionSheet: {
    padding: 5,
    gap: 12,
  },
  evolutionSheetTitle: {
    color: pokeballColors.black,
    fontSize: 30,
    fontWeight: '800',
  },
  evolutionList: {
    flex: 1,
    marginTop: 16,
  },
  evolutionListContent: {
    gap: 9,
    paddingBottom: 20,
    flexGrow: 1,
  },
  evolutionListRow: {
    minHeight: 128,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: pokeballColors.line,
    borderRadius: 14,
    backgroundColor: pokeballColors.white,
  },
  evolutionListRowSelected: {
    borderColor: pokeballColors.red,
    borderWidth: 2,
    backgroundColor: pokeballColors.redSoft,
  },
  evolutionRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  evolutionPortrait: {
    width: 52,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: pokeballColors.soft,
  },
  evolutionSilhouetteFrame: {
    backgroundColor: pokeballColors.redSoft,
  },
  evolutionSprite: {
    width: 50,
    height: 50,
  },
  evolutionArrow: {
    color: pokeballColors.red,
    fontSize: 18,
    fontWeight: '800',
  },
  evolutionRowNames: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 4,
    gap: 2,
  },
  evolutionListName: {
    color: pokeballColors.black,
    fontSize: 14,
    fontWeight: '800',
  },
  evolutionListDetail: {
    color: pokeballColors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  evolutionRowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  evolutionRequirement: {
    flexShrink: 1,
    color: pokeballColors.redDark,
    fontSize: 12,
    fontWeight: '700',
  },
  evolutionRequirementMissing: {
    color: pokeballColors.muted,
  },
  evolutionStatus: {
    color: pokeballColors.redDark,
    fontSize: 11,
    fontWeight: '800',
  },
  evolutionStatusMissing: {
    color: pokeballColors.muted,
  },
  evolutionEmptyText: {
    color: pokeballColors.muted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 36,
  },
  evolutionNotice: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: pokeballColors.redSoft,
    color: pokeballColors.redDark,
    fontSize: 13,
    fontWeight: '700',
  },
  evolutionTestButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: pokeballColors.line,
    backgroundColor: pokeballColors.white,
  },
  evolutionTestButtonText: {
    color: pokeballColors.black,
    fontSize: 12,
    fontWeight: '700',
  },
  evolutionPreview: {
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: pokeballColors.black,
    borderRadius: 14,
    backgroundColor: pokeballColors.white,
  },
  evolutionPreviewTitle: {
    color: pokeballColors.black,
    fontSize: 16,
    fontWeight: '800',
  },
  evolutionPreviewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  evolutionCancelButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: pokeballColors.soft,
  },
  evolutionCancelText: {
    color: pokeballColors.black,
    fontSize: 14,
    fontWeight: '800',
  },
  evolutionConfirmButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: pokeballColors.red,
  },
  evolutionConfirmButtonDisabled: {
    opacity: 0.55,
  },
  evolutionConfirmText: {
    color: pokeballColors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
