import { Link, Stack, router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function PaymentSuccessScreen() {
  const handleGoToChats = () => {
    router.replace('/(tabs)/chats');
  };

  return (
    <>
      <Stack.Screen options={{ title: '결제 완료' }} />
      <ThemedView style={styles.container}>
        {/* 성공 아이콘 */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        </View>

        {/* 성공 메시지 */}
        <ThemedText type="title" style={styles.title}>
          결제가 완료되었습니다!
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          팀에 성공적으로 참여하셨습니다.{'\n'}
          이제 채팅방에서 팀원들과 소통할 수 있습니다.
        </ThemedText>

        {/* 채팅방으로 이동 버튼 */}
        <TouchableOpacity style={styles.button} onPress={handleGoToChats}>
          <Ionicons
            name="chatbubbles"
            size={20}
            color="#FFFFFF"
            style={styles.buttonIcon}
          />
          <ThemedText style={styles.buttonText}>채팅방으로 이동</ThemedText>
        </TouchableOpacity>

        {/* 홈으로 이동 링크 */}
        <Link href="/(tabs)" style={styles.link}>
          <ThemedText type="link">홈으로 돌아가기</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
