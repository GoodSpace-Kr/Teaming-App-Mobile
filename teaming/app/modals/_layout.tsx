import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="leave-team-alert"
        options={{
          title: '팀플 나가기',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="unread-members-alert"
        options={{
          title: '읽지 않은 팀원',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="notification"
        options={{
          title: '알림',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
