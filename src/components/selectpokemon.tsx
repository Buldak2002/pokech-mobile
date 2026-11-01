import { BottomSheet, RNHostView } from "@expo/ui";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Pressable, View, Text, StyleSheet, Alert} from "react-native"
import { appStorage } from "../storage/appStorage";
import { OwnedPokemon, PokemonInstanceId } from "../feature/user/user.type";
import { POKEMON_DATA } from "../feature/pokedex/pokemon.data";
import { POKEMON_GEN5_IMAGES } from "../feature/pokedex/pokemonGen5Images";

type SelectPokemonProps = {
  isPresented: boolean;
  onDismiss: () => void;
  assignedPokemonIds: PokemonInstanceId[];

  onConfirm: (
    pokemonId: PokemonInstanceId,
  ) => void | Promise<void>
};

// storage에서 불러와서 엔트리 포켓몬 배치
// battle 안에서 날라가는 몬스터볼, 도망칠 확률 안잡힐 확률, 구현
// 도망쳤다면 도망쳤다, 안잡혔다 설명 해야함
// 진화
// 몬스터볼 개수
// 몬스터볼 다 떨어지면 알아서 배틀 종료
// 상점에서 살 수 있게 해야함

export function SelectPokemon({
  isPresented,
  onDismiss,
  assignedPokemonIds,
  onConfirm,
}: SelectPokemonProps) {

  const [entryPokemon, setEntryPokemon] = useState<(OwnedPokemon | null)[]>([])
  const [selectedPokemonId, setSelectedPokemonId] = useState<PokemonInstanceId | null>(null);

  useEffect(() => {
    if (!isPresented) {
      return;
    }

    const loadEntry = async () => {
      const gameSave = await appStorage.loadGame();

      if (!gameSave) {
        Alert.alert("게임 저장 데이터를 찾을 수 없습니다.");
        return;
      }

      setSelectedPokemonId(null);

      const hasPartyPokemon = gameSave.user.party.some(
        instanceId => instanceId !== null,
      );

      if (!hasPartyPokemon) {
        Alert.alert(
          "포획에 참가할 포켓몬이 없습니다! 엔트리에 포켓몬을 추가하세요!",
        );
        onDismiss();
        return;
      }

      const partyPokemon = gameSave.user.party.map(instanceId => {
        if (!instanceId) {
          return null;
        }

        return (
          gameSave.user.ownedPokemon.find(
            pokemon => pokemon.instanceId === instanceId,
          ) ?? null
        );
      });

      setEntryPokemon(partyPokemon);
    };

    void loadEntry();
  }, [isPresented, onDismiss]);

  const matchImage = (pokemon: OwnedPokemon | null) => {
    if (!pokemon) {
      return <Text>빈 슬롯</Text>;
    }

    const pokemonData = POKEMON_DATA.find(
      data => data.id === pokemon.speciesId,
    );
    const pokemonImage = POKEMON_GEN5_IMAGES[pokemon.speciesId]

    if (!pokemonData) {
      return <Text>포켓몬 정보를 찾을 수 없습니다.</Text>;
    }

    return (
      <View style={styles.entryContent}>
        <Image
          source={pokemonImage}
          style={{ width: 80, height: 80 }}
          contentFit="contain"
        />
        <View style={{flexDirection: "row", gap: 10, top: 5}}>
          <Text style={{fontWeight: "700"}}>{pokemonData.name}</Text>
          <Text style={{fontWeight: "500"}}>Lv. {pokemon.level}</Text>
        </View>
      </View>
    );
  };

  return (
    <BottomSheet
      isPresented={isPresented}
      onDismiss={onDismiss}
      snapPoints={["full"]}
    >
      <RNHostView>
        <View style={styles.sheetContent}>
          <View style={styles.pokemonBox}>
            <Text style={styles.pokemonText}>포켓몬</Text>
            <Text style={styles.message}>포획에 함께할 포켓몬을 고르자!</Text>
          </View>
          <View style={styles.entryGrid}>
            {
              entryPokemon.map((pokemon, index) => {

                const isAssiged = pokemon
                  ? assignedPokemonIds.includes(
                    pokemon.instanceId
                    )
                  : false;
                
                const isSelected = pokemon?.instanceId === selectedPokemonId;

                return(
                <Pressable 
                  key={index}
                  disabled={!pokemon || isAssiged}
                  onPress={() => {
                    if (!pokemon || isAssiged) return;
                    setSelectedPokemonId(pokemon.instanceId);
                  }}
                  style={({pressed}) => [
                    styles.entryBox,
                    isSelected && styles.selectedEntryBox,
                    isAssiged && styles.assignedEntryBox,
                    pressed && 
                      !isAssiged &&
                        styles.pressedEntryBox
                  ]}
                >
                  {matchImage(pokemon)}
                  {isAssiged && (
                    <Text style={styles.assignedText}>탐험 중</Text>
                  )} 
                </Pressable>
              )})
            }
          </View>

          <Pressable
            disabled={!selectedPokemonId}
            style={({ pressed }) => [
              styles.button,
              !selectedPokemonId && styles.disabledButton,
              pressed && selectedPokemonId && styles.pressedButton,
            ]}
            onPress={() => {
              if (!selectedPokemonId) return;
              void onConfirm(selectedPokemonId);
            }}
          >
            <Text style={styles.buttonText}>선택 완료!</Text>
          </Pressable>
        </View>
      </RNHostView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheetContent: {
    width: '100%',
    gap: 30,
    paddingVertical: 16,
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  pokemonText: {
    fontSize: 30,
    fontWeight: "700"
  },
  message: {
    fontSize: 15,
    fontWeight: "700",
    opacity: 0.6
  },
  pokemonBox: {
    bottom: 20,
    alignItems: 'center',
    gap: 7
  },
  entryGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  button: {
    width: '100%',
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#ef4444',
    borderRadius: 999,
  },
  disabledButton: {
    opacity: 0.4,
  },
  pressedButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  entryBox: {
    width: '48%',
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "transparent",
    borderCurve: 'continuous',
    boxShadow: "0 2px 5px rgba(15, 23, 42, 0.10), 0 8px 18px rgba(15, 23, 42, 0.12)",
  },
  selectedEntryBox: {
    borderColor: "#ef4444",
    backgroundColor: "#fff7f7",
  },
  pressedEntryBox: {
    opacity: 0.8
  },
  entryContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  assignedEntryBox: {
    opacity: 0.45,
  },

  assignedText: {
    marginTop: 6,
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
  },
})
