import { Text, View, StyleSheet, Pressable } from "react-native";
import { router } from 'expo-router'

type tutorialProps = {
    onComplete: () => void;
}

export default function Tutorial({ onComplete }: tutorialProps) {

    const tutorialEndHandler = () => {
        onComplete();
        router.replace('./home')
    }

    return (
        <View style={styles.container}>
            <Text>
                튜토리얼에 어서오고
            </Text>
            <Pressable
                style={styles.buttom}
                onPress={tutorialEndHandler}
            >
                <Text>
                    포켓몬 세상으로
                </Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({

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
    }

})