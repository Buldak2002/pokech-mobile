import { useState } from 'react';
import { BagPageHeading } from '../../../components/bag-page-heading';
import {
  Alert,
  GestureResponderEvent,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { MenuIcon } from '../../../components/bag-ui';
import { appStorage } from '../../../storage/appStorage';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const [error, setError] = useState<string | null>(null);
  function handleAction(event: GestureResponderEvent): void {
    throw new Error('Function not implemented.');
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
      <BagPageHeading title="설정" />
      <View style={{ alignItems: 'center', gap: 12 }}>
        <MenuIcon name="settings" size={64} />
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>
          Poketch
        </Text>
        <Text style={{ color: '#657481' }}>
          버전 {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </View>
      <Text style={{ color: '#657481', lineHeight: 22 }}>
        게임 진행은 기기에 자동으로 저장됩니다.
      </Text>
      {Platform.OS !== 'web' ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setError(null);
            void Linking.openSettings().catch(() =>
              setError(
                '기기 설정을 열지 못했어요. 휴대폰의 설정 앱에서 확인해 주세요.',
              ),
            );
          }}
          style={({ pressed }) => ({
            padding: 16,
            borderWidth: 1,
            borderColor: '#bbcbd3',
            backgroundColor: pressed ? '#d2e7ff' : '#edf3f5',
          })}
        >
          <Text style={{ color: '#111827', fontWeight: '700' }}>
            앱 권한 설정 열기 ›
          </Text>
        </Pressable>
      ) : (
        <Text style={{ color: '#657481' }}>
          앱 권한은 모바일 기기의 설정에서 변경할 수 있습니다.
        </Text>
      )}
      {error && (
        <Text selectable style={{ color: '#dc2626' }}>
          {error}
        </Text>
      )}

      <Pressable
        delayLongPress={5000}
        onPress={() => {
          Alert.alert(
            '안내',
            '초기화하려면 5초 동안 길게 눌러주세요.',
          );
        }}
        onLongPress={() => {
          Alert.alert(
            '튜토리얼 초기화',
            '정말 모든 데이터를 초기화할까요?',
            [
              {
                text: '취소',
                style: 'cancel',
              },
              {
                text: '초기화',
                style: 'destructive',
                onPress: async () => {
                  await appStorage.clearGame();
                  router.replace('/');
                },
              },
            ],
          );
        }}
        style={({ pressed }) => [
          styles.resetButton,
          pressed && styles.resetButtonPressed,
        ]}
      >
        {({ pressed }) => (
          <Text
            style={[
              styles.resetButtonText,
              pressed && styles.resetButtonTextPressed,
            ]}
          >
            {pressed
              ? '계속 누르세요...'
              : '튜토리얼 초기화'}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  resetButton: {
    minWidth: 180,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,

    borderWidth: 2,
    borderColor: '#9ca3af',
    borderRadius: 14,

    backgroundColor: '#ffffff',
  },

  resetButtonPressed: {
    borderColor: '#dc2626',
    backgroundColor: '#fee2e2',

    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  resetButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '800',
  },

  resetButtonTextPressed: {
    color: '#dc2626',
  },
});