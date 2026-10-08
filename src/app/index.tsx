import { router } from "expo-router"
import { View, Text, Pressable, StyleSheet, Image} from "react-native"
import { useEffect, useState } from "react";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEventListener } from "expo";

import Tutorial from "./tutorial";
import { appStorage } from "../storage/appStorage";
import type { GameSave, User } from "../feature/user/user.type";

export default function Index() {

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
            schemaVersion: 1,
            tutorialCompleted: true,
            user,
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
        <View style={styles.container}>
            <View>
                <Text style={styles.tagline}>걸어서 만나는 나만의 포켓몬 세상</Text>
                <Text>Poketch</Text>
            </View>
            <Image
                style={styles.mainHero}
                source={require('../../assets/images/pokemon-main-hero-v2.gif')}
            />
            <Pressable
                style={styles.buttom}
                onPress={() => setStartButtom(true)}
            >
                <Text style={styles.buttomLabel}>모험 하기</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({

    introContainer: {
        flex: 1,
    },
    introVideo: {
        flex: 1
    },

    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
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
    buttomLabel: {
        color: "white",
        fontSize: 20,
        fontWeight: "700",

    },
    mainHero: {
        width: 300,
        height: 500
    },

    tagline: {
        color: '#5f6368',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 1.2,
    }
})
