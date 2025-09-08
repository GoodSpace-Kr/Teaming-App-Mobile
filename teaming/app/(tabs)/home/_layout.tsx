import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '우리 팀플',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create-team"
        options={{
          title: '팀플 만들기',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="join-team"
        options={{
          title: '팀플 참여하기',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="team-detail/[id]"
        options={{
          title: '팀플 상세',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
