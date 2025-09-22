import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getChatRooms, ChatRoom } from '../../../src/services/chatService';

const { width } = Dimensions.get('window');

export default function ChatsScreen() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // 채팅방 탭이 포커스될 때마다 초기화 및 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      console.log('채팅방 화면 포커스 - 데이터 새로고침');
      fetchChatRooms();
    }, [])
  );

  // 채팅방 목록 가져오기
  const fetchChatRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const rooms = await getChatRooms();
      setChatRooms(rooms);
      console.log('✅ 채팅방 목록 로드 완료:', rooms.length, '개');
    } catch (err) {
      console.error('❌ 채팅방 목록 로드 실패:', err);
      setError('채팅방 목록을 불러오는데 실패했습니다.');
      Alert.alert('오류', '채팅방 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, [retryKey]);

  const handleEnterChatRoom = (roomId: number) => {
    router.push(`/(tabs)/chats/chat-room/${roomId}`);
  };

  // 시간 포맷팅 함수
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      });
    }
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>채팅방 목록을 불러오는 중...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setRetryKey((prev) => prev + 1);
              }}
            >
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : chatRooms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#666666" />
            <Text style={styles.emptyText}>아직 참여한 채팅방이 없습니다</Text>
            <Text style={styles.emptySubText}>
              팀에 참여하거나 새로운 팀을 만들어보세요!
            </Text>
          </View>
        ) : (
          chatRooms.map((room) => (
            <TouchableOpacity
              key={room.roomId}
              style={styles.chatRoomCard}
              onPress={() => handleEnterChatRoom(room.roomId)}
            >
              <View style={styles.chatRoomContent}>
                {/* 채팅방 아이콘 */}
                <View style={styles.roomIconContainer}>
                  {room.imageKey ? (
                    <Image
                      source={{
                        uri: `https://your-cdn-url.com/${room.imageKey}`,
                      }}
                      style={styles.roomIcon}
                      defaultSource={require('../../../assets/images/(beforeLogin)/bluePeople.png')}
                      onError={() => {
                        console.log('이미지 로드 실패, 기본 아이콘으로 대체');
                      }}
                    />
                  ) : (
                    <View style={styles.defaultRoomIcon}>
                      <Ionicons name="people" size={20} color="#4A90E2" />
                    </View>
                  )}
                  {room.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.roomInfo}>
                  <View style={styles.roomTitleRow}>
                    <Text style={styles.roomTitle} numberOfLines={1}>
                      {room.title}
                    </Text>
                    <Text style={styles.memberCount}>{room.memberCount}명</Text>
                  </View>

                  {room.lastMessage ? (
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {room.lastMessage.sender.name}: {room.lastMessage.content}
                    </Text>
                  ) : (
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      메시지가 없습니다
                    </Text>
                  )}
                </View>

                <View style={styles.timeContainer}>
                  {room.lastMessage && (
                    <Text style={styles.lastMessageTime}>
                      {formatTime(room.lastMessage.createdAt)}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
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

  // 로딩 상태
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 16,
  },

  // 에러 상태
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // 빈 상태
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },

  // 채팅방 아이콘
  roomIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  roomIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultRoomIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // 채팅방 정보
  roomTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 8,
  },
  timeContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
