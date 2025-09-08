import { Stack } from 'expo-router';

export default function ChatsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '채팅방',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="chat-room/[id]"
        options={{
          title: '티밍 톡',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create-task"
        options={{
          title: '과제 생성하기',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="data-room/[id]"
        options={{
          title: '자료실',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="chat-menu"
        options={{
          title: '톡 상단메뉴',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
