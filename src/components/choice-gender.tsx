import { Image as ExpoImage } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { UserGender } from "../feature/user/user.type";

const characters = {
  female: require(
    "../../assets/images/platinum-intro/dawn-run.png"
  ),
  male: require(
    "../../assets/images/platinum-intro/lucas-run.png"
  ),
} satisfies Record<UserGender, number>;

type CharacterSelectionProps = {
  onSelect: (gender: UserGender) => void;
};

export function CharacterSelection({
  onSelect,
}: CharacterSelectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>어떤 모습으로 모험할까?</Text>

      <View style={styles.characters}>
        <Pressable
          onPress={() => onSelect("female")}
          style={({ pressed }) => [
            styles.characterButton,
            pressed && styles.pressed,
          ]}
        >
          <ExpoImage
            source={characters.female}
            contentFit="contain"
            style={styles.character}
          />
          <Text style={styles.label}>여자</Text>
        </Pressable>

        <Pressable
          onPress={() => onSelect("male")}
          style={({ pressed }) => [
            styles.characterButton,
            pressed && styles.pressed,
          ]}
        >
          <ExpoImage
            source={characters.male}
            contentFit="contain"
            style={styles.character}
          />
          <Text style={styles.label}>남자</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    gap: 24,
  },

  title: {
    color: "#28261d",
    fontSize: 20,
    fontWeight: "800",
  },

  characters: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 28,
  },

  characterButton: {
    width: 140,
    alignItems: "center",
    padding: 12,
    gap: 8,
  },

  character: {
    width: 100,
    height: 190,
  },

  label: {
    color: "#28261d",
    fontSize: 17,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});