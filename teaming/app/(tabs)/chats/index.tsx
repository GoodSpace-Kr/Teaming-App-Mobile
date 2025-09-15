import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ChatRoom {
  id: number;
  title: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  members: any;
}

export default function ChatsScreen() {
  const chatRooms: ChatRoom[] = [
    {
      id: 1,
      title: '정치학 발표 4',
      lastMessage: '좀 에바긴한데.. ㅋㅋ 페이지 보셨나요?',
      lastMessageTime: '오후 8:54',
      unreadCount: 4,
      members: require('../../../assets/images/(beforeLogin)/bluePeople.png'),
    },
  ];

  const handleEnterChatRoom = (roomId: number) => {
    router.push(`/(tabs)/chats/chat-room/${roomId}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>티밍룸 목록</Text>
      </View>

      {/* 채팅방 목록 */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {chatRooms.map((room) => (
          <TouchableOpacity
            key={room.id}
            style={styles.chatRoomCard}
            onPress={() => handleEnterChatRoom(room.id)}
          >
            <View style={styles.chatRoomContent}>
              <Image source={room.members} style={styles.roomIcon} />
              <View style={styles.roomInfo}>
                <Text style={styles.roomTitle}>{room.title}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {room.lastMessage}
                </Text>
              </View>
              <Text style={styles.lastMessageTime}>{room.lastMessageTime}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  chatRoomCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  chatRoomContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 18,
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 8,
  },
});
