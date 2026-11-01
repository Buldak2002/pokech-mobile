import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type DialogueBoxProps = {
    dialogueId: number;
    speaker?: string;
    message: string;
    onNext: () => void;
    delay?: number;
}

export function DialogueBox({
    dialogueId,
    speaker,
    message,
    onNext,
    delay = 600,
}: DialogueBoxProps) {
    const [unlockedDialogueId, setUnlockedDialogueId] = useState<number | null>(null);
    const canAdvance = unlockedDialogueId === dialogueId;

    useEffect(() => {
        const timer = setTimeout(() => {
            setUnlockedDialogueId(dialogueId);
        }, delay);

        return () => clearTimeout(timer);
    }, [dialogueId, delay]);

    const handlePress = () => {
        if (!canAdvance) {
            return;
        }

        setUnlockedDialogueId(null);
        onNext();
    };

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canAdvance }}
            disabled={!canAdvance}
            onPress={handlePress}
            style={styles.textBox}
        >
            {speaker && (
                <Text style={styles.speaker}>
                    {speaker}
                </Text>
            )}

            <Text style={styles.message}>
                {message}
            </Text>

            {canAdvance && (
                <Text style={styles.nextIndicator}>▼</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
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
        borderColor: "#5b563f",
        borderRadius: 14,
        borderCurve: "continuous",
        boxShadow: "0 5px 0 rgba(65, 61, 43, 0.35)",
    },
    speaker: {
        marginBottom: 10,
        color: "#8a7021",
        fontSize: 17,
        fontWeight: "800",
    },
    message: {
        paddingRight: 20,
        color: "#28261d",
        fontSize: 18,
        fontWeight: "600",
        lineHeight: 28,
    },
    nextIndicator: {
        position: "absolute",
        right: 16,
        bottom: 12,
        color: "#8a7021",
        fontSize: 16,
        fontWeight: "900",
    },
});
