import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { BagPageHeading } from './bag-page-heading';

export function BagLoadState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string | null;
  retry: () => void;
}) {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <BagPageHeading title={loading ? '불러오는 중' : '불러오기 실패'} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 16,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#328af0" accessibilityLabel="불러오는 중" />
        ) : (
          <>
            <Text selectable style={{ color: '#657481', textAlign: 'center' }}>
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={retry}
              style={{ padding: 14 }}
            >
              <Text style={{ color: '#328af0', fontWeight: '700' }}>
                다시 시도
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
