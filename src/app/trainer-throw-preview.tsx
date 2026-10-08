import { Stack } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { TrainerThrowControl } from '../components/trainer-throw-animation';

export default function TrainerThrowPreviewScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Trainer Throw Preview',
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          alignItems: 'center',
          gap: 24,
          paddingHorizontal: 20,
          paddingVertical: 24,
        }}
      >
        <Text
          selectable
          style={{
            color: '#4B5B4D',
            fontSize: 15,
            lineHeight: 22,
            textAlign: 'center',
          }}
        >
          버튼을 누를 때마다 현재 모션을 중단하고 첫 프레임부터 한 번 재생합니다.
        </Text>

        <View
          style={{
            alignItems: 'center',
            backgroundColor: '#DCE8FF',
            borderCurve: 'continuous',
            borderRadius: 24,
            gap: 12,
            padding: 20,
            width: '100%',
          }}
        >
          <TrainerThrowControl character="lucas-pt" />
        </View>

        <View
          style={{
            alignItems: 'center',
            backgroundColor: '#FFE1E8',
            borderCurve: 'continuous',
            borderRadius: 24,
            gap: 12,
            padding: 20,
            width: '100%',
          }}
        >
          <TrainerThrowControl character="dawn-pt" />
        </View>
      </ScrollView>
    </>
  );
}
