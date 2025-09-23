import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import ChatBubble from '@/src/components/ChatBubble';
import { useWebSocket } from '@/src/hooks/useWebSocket';
import { getAccessToken } from '@/src/services/tokenManager';
import { ChatMessage } from '@/src/services/websocketService';

const { width, height } = Dimensions.get('window');

interface Message {
  id: number;
  text: string;
  user: string;
  userImage?: any;
  timestamp: string;
  isMe: boolean;
  readCount: number;
}

interface ChatRoomData {
  id: number;
  title: string;
  subtitle: string;
  members: any;
  memberCount: string;
}

export default function ChatRoomScreen() {
  const { id, isLeader } = useLocalSearchParams();
  const [inputText, setInputText] = useState('');
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [jwt, setJwt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // JWT 토큰 가져오기
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await getAccessToken();
        setJwt(token);
      } catch (error) {
        console.error('토큰 로드 실패:', error);
        Alert.alert('오류', '인증 토큰을 가져올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  // 웹소켓 연결 (JWT가 있을 때만)
  const {
    status,
    isConnected,
    messages: wsMessages,
    unreadCount,
    sendTextMessage,
    sendImageMessage,
    sendFileMessage,
    error: wsError,
  } = useWebSocket({
    jwt: jwt || '',
    roomId: Number(id),
    autoConnect: !!jwt,
  });

  // 목데이터 - 실제로는 API에서 가져올 데이터
  const chatRoomData: ChatRoomData = {
    id: Number(id),
    title: '정치학 발표',
    subtitle: '정치학개론',
    members: require('../../../../assets/images/(beforeLogin)/bluePeople.png'),
    memberCount: '3/4명',
  };

  // 웹소켓 에러 처리
  useEffect(() => {
    if (wsError) {
      Alert.alert('웹소켓 오류', wsError);
    }
  }, [wsError]);

  // 메시지 목록을 웹소켓 메시지로 변환
  const messages = wsMessages.map((wsMsg: ChatMessage) => ({
    id: wsMsg.messageId,
    text: wsMsg.content || '',
    user: wsMsg.sender.name,
    userImage: wsMsg.sender.avatarUrl
      ? { uri: wsMsg.sender.avatarUrl }
      : require('../../../../assets/images/(beforeLogin)/bluePeople.png'),
    timestamp: new Date(wsMsg.createdAt).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    isMe: false, // TODO: 현재 사용자 ID와 비교해서 설정
    readCount: 1, // TODO: 실제 읽음 수 구현
  }));

  const handleBackPress = () => {
    router.back();
  };

  const handleMenuPress = () => {
    // URL 파라미터에서 팀장 여부 확인
    const isTeamLeader = isLeader === 'true';
    router.push(
      `/(tabs)/chats/chat-menu?roomId=${id}&isLeader=${isTeamLeader}`
    );
  };

  const handleSendMessage = () => {
    console.log('📤 메시지 전송 버튼 클릭:', {
      inputText: inputText.trim(),
      isConnected,
      status,
      wsError,
    });

    if (inputText.trim()) {
      // 연결 상태와 관계없이 전송 시도
      sendTextMessage(inputText.trim());
      setInputText('');

      // 스크롤을 맨 아래로
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (isConnected) {
          // TODO: 파일 업로드 후 sendImageMessage 호출
          sendImageMessage(asset.fileName || '이미지', []);
          Alert.alert('이미지 전송', '이미지가 전송되었습니다.');
        } else {
          Alert.alert('연결 오류', '웹소켓이 연결되지 않았습니다.');
        }
        setShowFileMenu(false);
      }
    } catch (error) {
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
    }
  };

  const handleVideoPicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (isConnected) {
          // TODO: 파일 업로드 후 sendFileMessage 호출
          sendFileMessage(asset.fileName || '동영상', []);
          Alert.alert('동영상 전송', '동영상이 전송되었습니다.');
        } else {
          Alert.alert('연결 오류', '웹소켓이 연결되지 않았습니다.');
        }
        setShowFileMenu(false);
      }
    } catch (error) {
      Alert.alert('오류', '동영상을 선택하는 중 오류가 발생했습니다.');
    }
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (isConnected) {
          // TODO: 파일 업로드 후 sendFileMessage 호출
          sendFileMessage(asset.name, []);
          Alert.alert('파일 전송', '파일이 전송되었습니다.');
        } else {
          Alert.alert('연결 오류', '웹소켓이 연결되지 않았습니다.');
        }
        setShowFileMenu(false);
      }
    } catch (error) {
      Alert.alert('오류', '파일을 선택하는 중 오류가 발생했습니다.');
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;

    // 카카오톡과 동일한 로직: 같은 사람 + 같은 시간대 = 연속 메시지
    const isSameUser = prevMessage
      ? prevMessage.user === message.user && prevMessage.isMe === message.isMe
      : false;
    const isSameTime = prevMessage
      ? prevMessage.timestamp === message.timestamp
      : false;
    const isContinuous = isSameUser && isSameTime;

    // 사용자 정보 표시: 첫 번째 메시지이거나 다른 사람이거나 다른 시간대
    const showUserInfo = !isContinuous && !message.isMe;

    // 꼬리 표시: 다른 사람의 첫 번째 메시지 (연속 메시지가 아닌 경우)
    const showTail = !message.isMe && !isContinuous;

    return (
      <View key={message.id} style={styles.messageContainer}>
        {showUserInfo && (
          <View style={styles.userInfo}>
            <Image source={message.userImage} style={styles.userAvatar} />
            <Text style={styles.userName}>{message.user}</Text>
          </View>
        )}

        <ChatBubble
          text={message.text}
          isMe={message.isMe}
          showTail={showTail}
          isContinuous={isContinuous}
          timestamp={message.timestamp}
          readCount={message.readCount}
          backgroundColor={message.isMe ? '#007AFF' : '#333333'}
          textColor="#FFFFFF"
        />
      </View>
    );
  };

  // 로딩 중일 때
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>채팅방에 연결하는 중...</Text>
        </View>
      </View>
    );
  }

  // JWT가 없을 때
  if (!jwt) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>인증 토큰을 찾을 수 없습니다.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{chatRoomData.title}</Text>
          <View style={styles.connectionStatus}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? '#4CAF50' : '#FF6B6B' },
              ]}
            />
            <Text style={styles.statusText}>
              {isConnected
                ? '연결됨'
                : status === 'connecting'
                ? '연결 중...'
                : '연결 끊김'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 메시지 목록 */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => renderMessage(message, index))}
        </ScrollView>

        {/* 메시지 입력창 */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.plusButton}
            onPress={() => setShowFileMenu(true)}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="메시지를 입력하세요"
            placeholderTextColor="#666666"
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim()
                ? styles.sendButtonActive
                : styles.sendButtonInactive,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={inputText.trim() ? '#FFFFFF' : '#666666'}
            />
          </TouchableOpacity>
        </View>

        {/* 파일 선택 메뉴 모달 */}
        <Modal
          visible={showFileMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFileMenu(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowFileMenu(false)}
          >
            <View style={styles.fileMenuContainer}>
              <TouchableOpacity
                style={styles.fileMenuOption}
                onPress={handleImagePicker}
              >
                <View style={styles.fileMenuIcon}>
                  <Ionicons name="image" size={24} color="#FF2D92" />
                </View>
                <Text style={styles.fileMenuText}>이미지</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fileMenuOption}
                onPress={handleVideoPicker}
              >
                <View style={styles.fileMenuIcon}>
                  <Ionicons name="videocam" size={24} color="#AF52DE" />
                </View>
                <Text style={styles.fileMenuText}>동영상</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fileMenuOption}
                onPress={handleDocumentPicker}
              >
                <View style={styles.fileMenuIcon}>
                  <Ionicons name="document" size={24} color="#007AFF" />
                </View>
                <Text style={styles.fileMenuText}>파일</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#292929',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: -10,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 12,
    marginRight: 8,
  },
  userName: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#121216',
    borderTopWidth: 1,
    borderTopColor: '#292929',
  },
  plusButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#292929',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#292929',
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 12,
    color: '#FFFFFF',
    maxHeight: 50,
    marginRight: 12,
  },
  sendButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
  sendButtonInactive: {
    backgroundColor: '#292929',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  fileMenuContainer: {
    backgroundColor: '#121216',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 50,
    borderWidth: 1,
    borderColor: '#292929',
    borderBottomWidth: 0,
  },
  fileMenuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  fileMenuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  fileMenuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  // 연결 상태
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#CCCCCC',
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
});
