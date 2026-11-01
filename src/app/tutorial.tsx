import { Text, View, StyleSheet, Pressable, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Image as ExpoImage, ImageBackground } from "expo-image";
import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withSequence,
    withTiming,
} from "react-native-reanimated";

import { dialogueSteps, type DialogueCharacter } from "../feature/user/dialogueSteps"
import { CharacterSelection } from "../components/choice-gender";
import { RegionSelection } from "../components/choice-region"
import { DialogueBox } from "../components/dialogue-box";
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

const pokeBallImage = require("../../assets/items/poke-ball.png")

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

function PokeBallReward() {
    const reducedMotion = useReducedMotion();
    const rotation = useSharedValue(0);
    const ballScale = useSharedValue(0.95);
    const sparkleOpacity = useSharedValue(0);
    const sparkleScale = useSharedValue(0.8);

    useEffect(() => {
        sparkleOpacity.set(
            withSequence(
                withTiming(1, { duration: 160, easing: EASE_OUT }),
                withTiming(0, { duration: 360, easing: EASE_OUT }),
            ),
        );

        if (reducedMotion) {
            ballScale.set(1);
            return;
        }

        rotation.set(
            withSequence(
                withTiming(-10, { duration: 90, easing: EASE_IN_OUT }),
                withTiming(10, { duration: 90, easing: EASE_IN_OUT }),
                withTiming(-7, { duration: 80, easing: EASE_IN_OUT }),
                withTiming(7, { duration: 80, easing: EASE_IN_OUT }),
                withTiming(0, { duration: 120, easing: EASE_OUT }),
            ),
        );
        ballScale.set(
            withSequence(
                withTiming(1.1, { duration: 180, easing: EASE_OUT }),
                withTiming(1, { duration: 220, easing: EASE_OUT }),
            ),
        );
        sparkleScale.set(
            withSequence(
                withTiming(1.25, { duration: 180, easing: EASE_OUT }),
                withTiming(1, { duration: 260, easing: EASE_OUT }),
            ),
        );
    }, [ballScale, reducedMotion, rotation, sparkleOpacity, sparkleScale]);

    const ballAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${rotation.get()}deg` },
            { scale: ballScale.get() },
        ],
    }));

    const sparkleAnimatedStyle = useAnimatedStyle(() => ({
        opacity: sparkleOpacity.get(),
        transform: [{ scale: sparkleScale.get() }],
    }));

    return (
        <View style={styles.pokeBallReward}>
            <Animated.Text
                style={[styles.sparkle, styles.leftSparkle, sparkleAnimatedStyle]}
            >
                ✦
            </Animated.Text>
            <Animated.View style={ballAnimatedStyle}>
                <ExpoImage
                    source={pokeBallImage}
                    contentFit="contain"
                    style={styles.pokeBall}
                />
            </Animated.View>
            <Animated.Text
                style={[styles.sparkle, styles.rightSparkle, sparkleAnimatedStyle]}
            >
                ✦
            </Animated.Text>
        </View>
    );
}


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

        registeredPokemonIds: [
            starterPokemon.speciesId,
        ],

        party: [
        starterPokemon.instanceId,
        null,
        null,
        null,
        null,
        null,
        ],

        ownedItems: [
            {
                itemId: "poke-ball",
                quantity: 10,
            },
        ],

        energy: 0,
        stepEnergy: {
            dateKey: '',
            convertedSteps: 0,
        },
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

            <DialogueBox
                dialogueId={stepIndex}
                speaker={currentStep.speaker}
                message={
                    currentStep.showUsername
                        ? `${username} 멋진 이름이구나!`
                        : currentStep.message
                }
                onNext={handleDialoguePress}
            />
            </>
        );
        case "favortie-region":
            return (
                <RegionSelection onSelect={handleRegionPokemonSelect}/>
            )
        case "give-poke-ball":
            return (
                <>
                    <PokeBallReward />
                    <DialogueBox
                        dialogueId={stepIndex}
                        message="몬스터볼 10개를 받았다!"
                        onNext={handleDialoguePress}
                    />
                </>
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
    pokeBallReward: {
        width: 200,
        height: 150,
        alignItems: "center",
        justifyContent: "center",
    },
    pokeBall: {
        width: 120,
        height: 120,
    },
    sparkle: {
        position: "absolute",
        color: "#fff3a3",
        fontSize: 32,
        fontWeight: "900",
    },
    leftSparkle: {
        left: 8,
        top: 48,
    },
    rightSparkle: {
        right: 8,
        top: 24,
    },
})

const talks = StyleSheet.create({
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
