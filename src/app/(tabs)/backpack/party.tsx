import { useRef, useState } from 'react';
import { BottomSheet, RNHostView } from '@expo/ui';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BagPageHeading } from '../../../components/bag-page-heading';
import { BagLoadState } from '../../../components/bag-load-state';
import { StorageWallpaper } from '../../../components/storage-wallpaper';
import { useBagSave } from '../../../hooks/use-bag-save';
import { appStorage } from '../../../storage/appStorage';
import { POKEMON_DATA } from '../../../feature/pokedex/pokemon.data';
import {
  STORAGE_BOXES,
  getStorageBiome,
  placeInParty,
  type StorageBiome,
} from '../../../feature/pokedex/storage-boxes';
import type {
  OwnedPokemon,
  PokemonParty,
} from '../../../feature/user/user.type';

const species = new Map(POKEMON_DATA.map((pokemon) => [pokemon.id, pokemon]));
const BOX_CAPACITY = 18;

export default function PartyScreen() {
  const { save, loading, error, retry, setSave } = useBagSave();
  const [biome, setBiome] = useState<StorageBiome>('grass');
  const [page, setPage] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);

  const owned = save?.user.ownedPokemon ?? [];
  const party = save?.user.party ?? [null, null, null, null, null, null];
  const members = party.map((id) =>
    owned.find((pokemon) => pokemon.instanceId === id),
  );
  const selected = owned.find((pokemon) => pokemon.instanceId === selectedId);
  const selectedData = selected ? species.get(selected.speciesId) : undefined;
  const selectedIsParty = !!selected && party.includes(selected.instanceId);
  const selectedTargetBiome = selectedData
    ? getStorageBiome(selectedData.types)
    : undefined;
  const box = STORAGE_BOXES.find((value) => value.id === biome)!;
  const stored = owned.filter(
    (pokemon) =>
      !party.includes(pokemon.instanceId) &&
      getStorageBiome(species.get(pokemon.speciesId)?.types ?? []) === biome,
  );
  const totalStored = owned.filter(
    (pokemon) => !party.includes(pokemon.instanceId),
  ).length;
  const pageCount = Math.max(1, Math.ceil(stored.length / BOX_CAPACITY));
  const currentPage = Math.min(page, pageCount - 1);
  const cells = Array.from(
    { length: BOX_CAPACITY },
    (_, index) => stored[currentPage * BOX_CAPACITY + index],
  );

  const getStoredCount = (targetBiome: StorageBiome) =>
    owned.filter(
      (pokemon) =>
        !party.includes(pokemon.instanceId) &&
        getStorageBiome(species.get(pokemon.speciesId)?.types ?? []) ===
          targetBiome,
    ).length;

  const updateParty = async (slot: number | null) => {
    const pokemonId = selectedIdRef.current;
    if (!pokemonId || saveLock.current) return false;
    saveLock.current = true;
    setSaving(true);
    setMessage(null);
    try {
      const latest = await appStorage.loadGame();
      if (
        !latest ||
        !latest.user.ownedPokemon.some(
          (pokemon) => pokemon.instanceId === pokemonId,
        )
      ) {
        throw new Error('선택한 포켓몬의 저장 데이터를 찾지 못했어요.');
      }

      let nextParty: PokemonParty;
      if (slot === null) {
        if (latest.user.party.filter(Boolean).length <= 1) {
          throw new Error('엔트리에는 최소 한 마리를 남겨 주세요.');
        }
        nextParty = latest.user.party.map((id) =>
          id === pokemonId ? null : id,
        ) as PokemonParty;
      } else {
        nextParty = placeInParty(latest.user.party, pokemonId, slot);
      }

      const next = { ...latest, user: { ...latest.user, party: nextParty } };
      await appStorage.saveGame(next);
      setSave(next);
      selectedIdRef.current = null;
      setSelectedId(null);
      setMessage(
        slot === null
          ? '타입에 맞는 보관함으로 옮겼어요.'
          : '엔트리를 변경했어요.',
      );
      return true;
    } catch (failure) {
      setMessage(
        failure instanceof Error
          ? failure.message
          : '저장하지 못했어요. 선택을 유지했으니 다시 시도해 주세요.',
      );
      return false;
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  };

  const selectPokemon = (pokemon: OwnedPokemon) => {
    if (saving) return;
    const nextId =
      selectedIdRef.current === pokemon.instanceId ? null : pokemon.instanceId;
    selectedIdRef.current = nextId;
    setSelectedId(nextId);
    setMessage(null);
  };

  const pressPartySlot = async (
    pokemon: OwnedPokemon | undefined,
    slot: number,
  ) => {
    if (saving) return;
    const activeSelectedId = selectedIdRef.current;
    if (!activeSelectedId) {
      if (pokemon) {
        selectPokemon(pokemon);
      } else {
        setMessage('먼저 보관함에서 포켓몬을 선택해 주세요.');
      }
      return;
    }
    if (pokemon?.instanceId === activeSelectedId) {
      selectPokemon(pokemon);
      return;
    }
    const success = await updateParty(slot);
    if (success) setSheetOpen(false);
  };

  const pressBiomeBox = async (requestedBiome: StorageBiome) => {
    if (saving) return;
    if (selectedIsParty) {
      const destination = selectedTargetBiome ?? 'grass';
      const success = await updateParty(null);
      if (!success) return;
      setBiome(destination);
      setPage(0);
      setSheetOpen(true);
      return;
    }
    setBiome(requestedBiome);
    setPage(0);
    setSheetOpen(true);
  };

  const instruction = saving
    ? '저장 중…'
    : (message ??
      (selectedData
        ? selectedIsParty
          ? `${selectedData.name} 선택됨 · 보관함을 누르면 자동으로 분류돼요.`
          : `${selectedData.name} 선택됨 · 배치할 엔트리 칸을 누르세요.`
        : '포켓몬을 선택한 다음 옮길 위치를 누르세요.'));

  if (loading || error) {
    return <BagLoadState loading={loading} error={error} retry={retry} />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <BagPageHeading title="포켓몬" />

        <View style={styles.sectionTitle}>
          <View>
            <Text style={styles.sectionText}>엔트리</Text>
            <Text style={styles.sectionCaption}>함께 모험하는 포켓몬</Text>
          </View>
          <Text style={styles.sectionCount}>
            {members.filter(Boolean).length} / 6
          </Text>
        </View>

        <View style={styles.party}>
          {members.map((pokemon, index) => {
            const data = pokemon ? species.get(pokemon.speciesId) : undefined;
            return (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityLabel={
                  selectedId
                    ? `${index + 1}번 엔트리 칸에 배치`
                    : data
                      ? `${data.name} 선택`
                      : '빈 엔트리 칸'
                }
                accessibilityState={{
                  disabled: saving || (!pokemon && !selectedId),
                  selected: !!pokemon && selectedId === pokemon.instanceId,
                }}
                disabled={saving || (!pokemon && !selectedId)}
                onPress={() => void pressPartySlot(pokemon, index)}
                style={({ pressed }) => [
                  styles.partyRow,
                  !pokemon && styles.emptyPartyRow,
                  !!pokemon &&
                    selectedId === pokemon.instanceId &&
                    styles.selected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.slotNumber}>{index + 1}</Text>
                {data ? (
                  <>
                    <Image
                      source={data.image}
                      contentFit="contain"
                      style={styles.partySprite}
                    />
                    <Text style={styles.pokemonName}>{data.name}</Text>
                    <Text style={styles.level}>Lv. {pokemon!.level}</Text>
                  </>
                ) : (
                  <Text style={styles.emptyParty}>
                    {selectedId ? '이 칸에 배치' : '빈 엔트리 칸'}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionTitle}>
          <View>
            <Text style={styles.sectionText}>보관함</Text>
            <Text style={styles.sectionCaption}>바이옴별 포켓몬 박스</Text>
          </View>
          <Text style={styles.sectionCount}>{totalStored}마리</Text>
        </View>

        <Text accessibilityLiveRegion="polite" style={styles.hint}>
          {instruction}
        </Text>

        <View style={styles.biomeGrid}>
          {STORAGE_BOXES.map((option) => {
            const count = getStoredCount(option.id);
            const isDestination =
              selectedIsParty && selectedTargetBiome === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityLabel={`${option.name} 보관함 ${count}마리${isDestination ? ', 선택한 포켓몬의 보관 위치' : ''}`}
                disabled={saving}
                onPress={() => void pressBiomeBox(option.id)}
                style={({ pressed }) => [
                  styles.biomeCard,
                  isDestination && styles.destinationCard,
                  pressed && styles.pressed,
                ]}
              >
                <StorageWallpaper x={option.x} y={option.y}>
                  <View style={styles.biomeCardContent}>
                    <View style={styles.biomeCardTop}>
                      <Text style={styles.biomeName}>{option.name}</Text>
                      <Text style={styles.biomeCount}>{count}</Text>
                    </View>
                    <Text style={styles.biomeAction}>
                      {isDestination ? '여기로 자동 보관' : '눌러서 열기'}
                    </Text>
                  </View>
                </StorageWallpaper>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.classification}>
          엔트리 포켓몬은 첫 번째 타입에 맞는 박스로 자동 분류됩니다.
        </Text>
      </ScrollView>

      <BottomSheet
        isPresented={sheetOpen}
        onDismiss={() => setSheetOpen(false)}
        snapPoints={['full']}
        contentPadding={0}
        containerColor="#f7fafc"
      >
        <RNHostView>
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator
          >
            <View style={styles.sheetHeading}>
              <View>
                <Text style={styles.sheetTitle}>{box.name} 보관함</Text>
                <Text style={styles.sheetSubtitle}>
                  포켓몬을 누른 뒤 엔트리 칸을 선택하세요.
                </Text>
              </View>
              <Text style={styles.sheetCount}>{stored.length}마리</Text>
            </View>

            <StorageWallpaper x={box.x} y={box.y}>
              <View style={styles.boxHeader}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="이전 박스"
                  disabled={currentPage === 0}
                  onPress={() => setPage(currentPage - 1)}
                  style={styles.pageButton}
                >
                  <Text
                    style={[
                      styles.pageArrow,
                      currentPage === 0 && styles.disabled,
                    ]}
                  >
                    ‹
                  </Text>
                </Pressable>
                <Text style={styles.boxLabel}>
                  {box.name} BOX {String(currentPage + 1).padStart(2, '0')} /{' '}
                  {pageCount}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="다음 박스"
                  disabled={currentPage >= pageCount - 1}
                  onPress={() => setPage(currentPage + 1)}
                  style={styles.pageButton}
                >
                  <Text
                    style={[
                      styles.pageArrow,
                      currentPage >= pageCount - 1 && styles.disabled,
                    ]}
                  >
                    ›
                  </Text>
                </Pressable>
              </View>
              <View style={styles.boxGrid}>
                {[0, 1, 2].map((row) => (
                  <View key={row} style={styles.boxRow}>
                    {cells
                      .slice(row * 6, row * 6 + 6)
                      .map((pokemon, column) => {
                        const data = pokemon
                          ? species.get(pokemon.speciesId)
                          : undefined;
                        return (
                          <Pressable
                            key={column}
                            hitSlop={3}
                            accessibilityRole="button"
                            accessibilityLabel={
                              data ? `${data.name} 선택` : '빈 보관함 칸'
                            }
                            accessibilityState={{
                              disabled: !pokemon || saving,
                              selected:
                                !!pokemon && selectedId === pokemon.instanceId,
                            }}
                            disabled={!pokemon || saving}
                            onPress={() => pokemon && selectPokemon(pokemon)}
                            style={[
                              styles.boxCell,
                              !!pokemon &&
                                selectedId === pokemon.instanceId &&
                                styles.selected,
                            ]}
                          >
                            {data ? (
                              <Image
                                source={data.image}
                                contentFit="contain"
                                pointerEvents="none"
                                style={styles.boxSprite}
                              />
                            ) : (
                              <Text style={styles.emptySlot}>○</Text>
                            )}
                          </Pressable>
                        );
                      })}
                  </View>
                ))}
              </View>
            </StorageWallpaper>
            
            <View style={{top: 20, gap: 30}}>
              <View style={[styles.sheetEntryTitle, {top: 15}]}>
                <Text style={styles.sheetEntryText}>엔트리에 배치</Text>
                <Text style={styles.sheetEntryCount}>
                  {members.filter(Boolean).length} / 6
                </Text>
              </View>
              <View style={styles.sheetPartyGrid}>
                {members.map((pokemon, index) => {
                  const data = pokemon
                    ? species.get(pokemon.speciesId)
                    : undefined;
                  return (
                    <Pressable
                      key={index}
                      accessibilityRole="button"
                      accessibilityLabel={`${index + 1}번 엔트리 칸에 배치`}
                      accessibilityState={{
                        disabled: saving,
                        selected: !!pokemon && selectedId === pokemon.instanceId,
                      }}
                      disabled={saving}
                      onPress={() => void pressPartySlot(pokemon, index)}
                      style={({ pressed }) => [
                        styles.sheetPartySlot,
                        !pokemon && styles.emptySheetPartySlot,
                        !!pokemon &&
                          selectedId === pokemon.instanceId &&
                          styles.selected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.sheetSlotNumber}>{index + 1}</Text>
                      {data ? (
                        <>
                          <Image
                            source={data.image}
                            contentFit="contain"
                            style={styles.sheetPartySprite}
                          />
                          <Text numberOfLines={1} style={styles.sheetPokemonName}>
                            {data.name}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.sheetEmptyParty}>빈 칸</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            
              <Text accessibilityLiveRegion="polite" style={styles.sheetHint}>
                {instruction}
              </Text>
            </View>
          </ScrollView>
        </RNHostView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 28 },
  sectionTitle: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#c5d6e4',
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: '#dfeaf3',
    boxShadow: '0 2px 5px rgba(35, 58, 70, 0.1)',
  },
  sectionText: { color: '#172c43', fontWeight: '900', fontSize: 18 },
  sectionCaption: { color: '#6f8293', fontSize: 11, paddingTop: 2 },
  sectionCount: {
    color: '#172c43',
    fontWeight: '800',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  party: { gap: 6, paddingTop: 8, paddingBottom: 16 },
  partyRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#cbd9e4',
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: '#e7eff6',
  },
  emptyPartyRow: { borderColor: '#e1e8ee', backgroundColor: '#f8fafc' },
  slotNumber: { width: 14, fontSize: 11, color: '#8a9baa' },
  partySprite: { width: 70, height: 70, margin: -10 },
  pokemonName: { flex: 1, color: '#172c43', fontWeight: '800', fontSize: 15 },
  level: { color: '#344e66', fontSize: 13, fontWeight: '700' },
  emptyParty: { color: '#9aabb8', fontSize: 13 },
  hint: {
    minHeight: 38,
    color: '#526476',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  biomeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  biomeCard: {
    flexGrow: 1,
    flexBasis: '46%',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  destinationCard: {
    borderColor: '#239bef',
    boxShadow: '0 0 0 2px rgba(35, 155, 239, 0.18)',
  },
  biomeCardContent: {
    minHeight: 92,
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#16334a33',
  },
  biomeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  biomeName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    textShadowColor: '#19354a99',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  biomeCount: {
    minWidth: 28,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
    color: '#172c43',
    backgroundColor: '#ffffffdd',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  biomeAction: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    color: '#28445b',
    backgroundColor: '#ffffffdd',
    fontSize: 10,
    fontWeight: '800',
  },
  classification: {
    color: '#8293a0',
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    paddingTop: 10,
  },
  sheetScroll: { flex: 1 },
  sheetContent: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  sheetHeading: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: { color: '#172c43', fontSize: 22, fontWeight: '900' },
  sheetSubtitle: { color: '#718493', fontSize: 11, paddingTop: 3 },
  sheetCount: {
    color: '#526476',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  boxHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffffaa',
    bottom: 5
  },
  pageButton: {
    minWidth: 48,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageArrow: { fontSize: 26, color: '#172c43', paddingBottom: 5 },
  boxLabel: {
    minWidth: 160,
    color: '#172c43',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  disabled: { opacity: 0.25 },
  boxGrid: { gap: 5, paddingHorizontal: 10, paddingTop: 9, paddingBottom: 12 },
  boxRow: { flexDirection: 'row', gap: 5 },
  boxCell: {
    flex: 1,
    minWidth: 0,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff99',
    borderRadius: 8,
    backgroundColor: '#ffffff2e',
  },
  boxSprite: { width: '100%', height: 44 },
  emptySlot: { color: '#ffffffaa', fontSize: 18 },
  sheetEntryTitle: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: '#dfeaf3',
  },
  sheetEntryText: { color: '#172c43', fontSize: 15, fontWeight: '900' },
  sheetEntryCount: {
    color: '#526476',
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  sheetPartyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sheetPartySlot: {
    minHeight: 56,
    flexGrow: 1,
    flexBasis: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#cbd9e4',
    borderRadius: 9,
    borderCurve: 'continuous',
    backgroundColor: '#e7eff6',
  },
  emptySheetPartySlot: { borderColor: '#e1e8ee', backgroundColor: '#f8fafc' },
  sheetSlotNumber: { color: '#8a9baa', fontSize: 10 },
  sheetPartySprite: { width: 38, height: 38 },
  sheetPokemonName: {
    flex: 1,
    color: '#172c43',
    fontSize: 12,
    fontWeight: '800',
  },
  sheetEmptyParty: { color: '#9aabb8', fontSize: 11 },
  sheetHint: {
    minHeight: 36,
    color: '#526476',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  selected: {
    borderColor: '#239bef',
    backgroundColor: '#d6edffaa',
    borderWidth: 2,
  },
  pressed: { opacity: 0.65 },
});
