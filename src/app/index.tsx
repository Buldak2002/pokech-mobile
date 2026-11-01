import { router } from "expo-router"
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Image,
    useWindowDimensions,
} from "react-native"
import { useEffect, useState } from "react";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEventListener } from "expo";
import { SafeAreaView } from "react-native-safe-area-context";

import Tutorial from "./tutorial";
import { appStorage } from "../storage/appStorage";
import type { GameSave, User } from "../feature/user/user.type";

export default function Index() {

    const { width, height } = useWindowDimensions();
    const logoHeight = Math.min(165, height * 0.18);
    const logoWidth = Math.min(width - 24, logoHeight * 2);
    const heroHeight = Math.min(660, height * 0.6, (width - 8) / 0.6);
    const heroWidth = heroHeight * 0.6;

    const [isIntroFinished, setIsIntroFinished] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [startButtom, setStartButtom] = useState(false);
    const [isFirstLaunch, setIsFirstLaunch] = useState<boolean|null>(null);

    // intro animation 관련 hook
    const player = useVideoPlayer(
        require('../../assets/animations/pokemon-intro-v2.mp4'),
        (player) => {
            player.loop = false;
            player.play();
        }
    )

    useEventListener(player, 'playToEnd', () => {
        setIsIntroFinished(true);
    })

    // 최초 tutorial 함수 hook
    useEffect(() => {
        const checkFirstLaunch = async() => {
            try {
                const savedGame = await appStorage.loadGame();
                setIsFirstLaunch(
                    savedGame?.tutorialCompleted !== true,
                );
            } catch {
                console.error("저장소를 읽는 중 에러 발생");
                setIsFirstLaunch(true);
            } finally {
                setIsLoading(false)
            }
        }
        checkFirstLaunch();
    },[])

    useEffect(() => {
        if(!isLoading && isFirstLaunch === false && startButtom) {
            router.replace('/home');
        }
    },[isLoading, isFirstLaunch, startButtom])

    // 튜토리얼 화면에 보내기 위한 함수
    const handleTutorialComplete = async (user: User): Promise<void> => {
        const gameSave: GameSave = {
            schemaVersion: 2,
            tutorialCompleted: true,
            user,
            explorations: {}
        };

        await appStorage.saveGame(gameSave);

        setIsFirstLaunch(false);
    };
    // 비디오 실행
    if(!isIntroFinished) {
        return (
            <View style={styles.introContainer}>
                <VideoView
                    style={styles.introVideo}
                    player={player}
                    nativeControls={false}
                    contentFit="cover"
                />
            </View>
        )
    }

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text>저장 데이터를 확인하는 중...</Text>
            </View>
        );
    }

    //튜토리얼 실행 시 tutorial 컴포넌트로 함수 보내기
    if(isFirstLaunch && startButtom) {
        return (
            <Tutorial onComplete={handleTutorialComplete}/>
        )
    }

    //main 화면
    return (
        <SafeAreaView
            edges={['top', 'bottom', 'left', 'right']}
            style={styles.safeArea}
        >
            <View style={styles.container}>
                <View style={styles.brandBlock}>
                    <Text style={styles.tagline}>걸어서 만나는 나만의 포켓몬 세상</Text>
                    <Image
                        resizeMode="contain"
                        source={require('../../assets/images/poketch-logo.png')}
                        style={{ width: logoWidth, height: logoHeight }}
                    />
                </View>
                <Pressable
                    accessibilityHint="모험을 시작합니다"
                    accessibilityLabel="포켓몬 무리를 눌러서 시작"
                    accessibilityRole="button"
                    onPress={() => setStartButtom(true)}
                    style={({ pressed }) => [
                        styles.heroButton,
                        { width: heroWidth, height: heroHeight + 36 },
                        pressed && styles.heroButtonPressed,
                    ]}
                >
                    <Text style={styles.startLabel}>포켓몬을 눌러서 시작!</Text>
                    <Image
                        resizeMode="contain"
                        source={require('../../assets/images/pokemon-main-hero-v2.gif')}
                        style={{ width: heroWidth, height: heroHeight }}
                    />
                </Pressable>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },

    introContainer: {
        flex: 1,
    },
    introVideo: {
        flex: 1
    },

    container: {
        flex: 1,
        overflow: "hidden",
        alignItems: "center",
        paddingHorizontal: 4,
        paddingTop: 34,
        paddingBottom: 8,
    },
    brandBlock: {
        alignItems: "center",
    },
    heroButton: {
        alignItems: "center",
        justifyContent: "flex-start",
        marginTop: -4,
    },
    heroButtonPressed: {
        opacity: 0.82,
        transform: [{ scale: 0.98 }],
    },
    startLabel: {
        marginTop: 20,
        color: '#3f5368',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.6,
        opacity: 0.7,
    },
    tagline: {
        color: '#5f6368',
        fontSize: 17,
        fontWeight: '600',
        lineHeight: 23,
        letterSpacing: 1.2,
        textAlign: 'center',
    }
})
