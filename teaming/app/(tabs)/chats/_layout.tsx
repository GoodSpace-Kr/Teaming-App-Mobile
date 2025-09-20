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
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="data-room/[id]"
        options={{
          title: '자료실',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="chat-menu"
        options={{
          title: '톡 상단메뉴',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="task-list"
        options={{
          title: '과제 목록',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="view-task"
        options={{
          title: '과제 확인',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="submit-task"
        options={{
          title: '과제 제출',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="task-submissions"
        options={{
          title: '과제 제출 확인',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
