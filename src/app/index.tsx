import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/pokemon/showdown/front/550.gif')}
        style={styles.pokemon}
        resizeMode='contain'
      />
    </View>
  );
}

/*
  1. 탭바에 가방을 홈화면 위로 올리기
  2. 원래 탭바의 가방 자리에 트레이너 정보 칸 넣기
  3. 즐겨찾기 해둔 running 스프라이트 활용하기
  4. 케릭터 성별 선택 가능하게 하고, user 만들기
  5. 포켓몬 배경 리소스 활용하여 지형별 포켓몬 저장하기
  6. 도감 탭에 필터 기능 추가하기
*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff8f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pokemon: {
    width: 170,
    height: 170
  }
});
