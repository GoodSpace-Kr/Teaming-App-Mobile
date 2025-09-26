import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '마이페이지',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="account-info"
        options={{
          title: '계정 정보',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="change-password"
        options={{
          title: '비밀번호 변경',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="notification-settings"
        options={{
          title: '알림 설정',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="terms-privacy"
        options={{
          title: '약관 및 정책',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="gifticon"
        options={{
          title: '내 기프티콘',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
