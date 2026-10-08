import { Text, View, StyleSheet, Pressable, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Image as ExpoImage, ImageBackground } from "expo-image";

import { dialogueSteps, type DialogueCharacter } from "../feature/user/dialogueSteps"
import { CharacterSelection } from "../components/choice-gender";
import { RegionSelection } from "../components/choice-region"
import type { UserGender, User } from "../feature/user/user.type";
import type { Pokemon } from "../feature/pokedex/pokemon.type";

import { createOwnedPokemon } from "../feature/user/create-owned-pokemon";

type TutorialProps = {
    onComplete: (user: User) => Promise<void>;
}

const background = require(
  "../../assets/images/platinum-intro/platinum-intro-background-portrait.png"
);

const characterImages: Record<DialogueCharacter, number> = {
  rowan: require(
    "../../assets/images/platinum-intro/prof-rowan-idle.png"
  ),
  dawn: require(
    "../../assets/images/platinum-intro/dawn-run.png"
  ),
  lucas: require(
    "../../assets/images/platinum-intro/lucas-run.png"
  ),
};


export default function Tutorial({ onComplete }: TutorialProps) {

    const [username, setUsername] = useState("");
    const [userGender, setUserGender] = useState<UserGender | null>(null);
    const [favoriteRegionPokemon, setFavoriteRegionPokemon] = useState<Pokemon | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [stepIndex, setStepIndex] = useState(0);
    const currentStep = dialogueSteps[stepIndex];
    const [clear, setClear] = useState(false);

    const tutorialEndHandler = async () => {
    if (
        !username.trim() ||
        !userGender ||
        !favoriteRegionPokemon ||
        isSaving
    ) {
        return;
    }

    const starterPokemon = createOwnedPokemon({
        speciesId: favoriteRegionPokemon.id,
    });

    const user: User = {
        name: username.trim(),
        gender: userGender,

        ownedPokemon: [
        starterPokemon,
        ],

        party: [
        starterPokemon.instanceId,
        null,
        null,
        null,
        null,
        null,
        ],
    };

    try {
        setIsSaving(true);
        setSaveError(null);

        await onComplete(user);
    } catch {
        setSaveError(
        "저장에 실패했습니다. 다시 시도해 주세요.",
        );
    } finally {
        setIsSaving(false);
    }
    };

    const handleGenderSelect = (gender: UserGender) => {
        setUserGender(gender);
        setStepIndex((current) => current + 1);
    };
    const handleNameSubmit = () => {
        const trimName = username?.trim();
        if(!trimName) {
            return;
        }
        setUsername(trimName);
        setStepIndex((current) => current + 1);
    }
    const handleRegionPokemonSelect = (pokemon: Pokemon) => {
        setFavoriteRegionPokemon(pokemon);
        setStepIndex((current) => current + 1);
    }
    const handleDialoguePress = () => {
        const isLastStep = stepIndex === dialogueSteps.length - 1;

        if (isLastStep) {
            setClear(true);
            return;
        }

        setStepIndex((current) => current + 1);
    };

    const renderCurrentStep = () => {
    switch (currentStep.type) {
        case "gender-selection":
        return (
            <CharacterSelection
                onSelect={handleGenderSelect}
            />
        );
        case "name-input":
        return (
            <View style={talks.nameInputContainer}>
            <Text style={talks.nameQuestion}>
                너의 이름을 알려주겠니?
            </Text>

            <TextInput
                value={username}
                onChangeText={setUsername}
                onSubmitEditing={handleNameSubmit}
                placeholder="이름을 입력하세요"
                placeholderTextColor="#8d8975"
                maxLength={10}
                autoFocus
                returnKeyType="done"
                style={talks.nameInput}
            />

            <Pressable
                onPress={handleNameSubmit}
                disabled={!username.trim()}
                style={({ pressed }) => [
                talks.nameButton,
                !username.trim() && talks.nameButtonDisabled,
                pressed && talks.nameButtonPressed,
                ]}
            >
                <Text style={talks.nameButtonText}>
                결정
                </Text>
            </Pressable>
            </View>
        );
        case "dialogue":
        return (
            <>
            {currentStep.character && (
                <ExpoImage
                source={characterImages[currentStep.character]}
                contentFit="contain"
                style={styles.rowan}
                />
            )}

            <Pressable
                onPress={handleDialoguePress}
                style={talks.textBox}
            >
                <Text style={talks.speaker}>
                {currentStep.speaker}
                </Text>

                {currentStep.showUsername ?
                    <Text style={talks.message}>{`${username} 멋진 이름이구나!`}</Text> :
                    <Text style={talks.message}>{currentStep.message}</Text>
                }

                <Text style={talks.nextIndicator}>▼</Text>
            </Pressable>
            </>
        );
        case "favortie-region":
            return (
                <RegionSelection onSelect={handleRegionPokemonSelect}/>
            )
    }
    };

    return (

        <ImageBackground
            source={background}
            contentFit="cover"
            style={styles.background}
        >
            <View style={styles.container}>
                <StatusBar style="dark" />

                {
                    clear ?

                    <View style={styles.completionContainer}>
                        <Pressable
                            onPress={tutorialEndHandler}
                            disabled={isSaving}
                            style={({ pressed }) => [
                                styles.completionButton,
                                isSaving && styles.completionButtonDisabled,
                                pressed && !isSaving && styles.completionButtonPressed,
                            ]}
                        >
                            <Text style={styles.text}>
                                {isSaving ? "저장 중..." : "포켓몬 세상으로"}
                            </Text>
                        </Pressable>

                        {saveError && (
                            <Text style={styles.saveError} selectable>
                                {saveError}
                            </Text>
                        )}
                    </View>

                    :

                    <View style={styles.contentarea}>
                        {renderCurrentStep()}
                    </View>
                }
            </View>
        </ImageBackground>
    )
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingHorizontal: 10,
        paddingVertical: 10
    },
    buttom: {
        width: 160,
        height: 65,
        borderRadius: 15,
        top: 40,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#c93030",
    },
    text: {
        fontSize: 30,
        fontWeight: "700"
    },

    background: {
        flex: 1,
    },
    contentarea: {
        flex: 1,
        width: "100%",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        bottom: 40
    },
    completionContainer: {
        alignItems: "center",
        gap: 12,
    },
    completionButton: {
        minWidth: 220,
        minHeight: 64,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
        backgroundColor: "rgba(255, 255, 238, 0.96)",
        borderWidth: 4,
        borderColor: "#5b563f",
        borderRadius: 14,
        borderCurve: "continuous",
    },
    completionButtonDisabled: {
        opacity: 0.55,
    },
    completionButtonPressed: {
        transform: [{ scale: 0.97 }],
    },
    saveError: {
        maxWidth: 280,
        color: "#b91c1c",
        textAlign: "center",
    },
    rowan: {
        width: 160,
        height: 264,
    },
})

const talks = StyleSheet.create({
  textBox: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 28,

    height: 180,
    paddingHorizontal: 20,
    paddingVertical: 18,

    backgroundColor: "rgba(255, 255, 238, 0.96)",
    borderWidth: 4,
    borderColor: "#5B563F",
    borderRadius: 14,
    borderCurve: "continuous",

    boxShadow: "0 5px 0 rgba(65, 61, 43, 0.35)",
  },

  speaker: {
    marginBottom: 10,

    color: "#8A7021",
    fontSize: 17,
    fontWeight: "800",
  },

  message: {
    paddingRight: 20,

    color: "#28261D",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 28,
  },

  nextIndicator: {
    position: "absolute",
    right: 16,
    bottom: 12,

    color: "#8A7021",
    fontSize: 16,
    fontWeight: "900",
  },

  nameInputContainer: {
    width: "88%",
    alignItems: "center",
    padding: 24,
    gap: 18,

    backgroundColor: "rgba(255, 255, 238, 0.96)",
    borderWidth: 4,
    borderColor: "#5b563f",
    borderRadius: 14,
  },

  nameQuestion: {
    color: "#28261d",
    fontSize: 20,
    fontWeight: "800",
  },

    nameInput: {
    width: "100%",
    height: 56,
    paddingHorizontal: 16,

    color: "#28261d",
    fontSize: 18,

    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: "#8a7021",
    borderRadius: 10,
  },

    nameButton: {
    minWidth: 120,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#8a7021",
    borderRadius: 10,
  },

    nameButtonDisabled: {
    opacity: 0.4,
  },

    nameButtonPressed: {
    transform: [{ scale: 0.97 }],
  },

    nameButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
  },
})
