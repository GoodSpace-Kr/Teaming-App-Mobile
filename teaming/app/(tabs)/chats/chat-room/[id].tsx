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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ChatBubble from '@/src/components/ChatBubble';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // 목데이터 - 실제로는 API에서 가져올 데이터
  const chatRoomData: ChatRoomData = {
    id: Number(id),
    title: '정치학 발표',
    subtitle: '정치학개론',
    members: require('../../../../assets/images/(beforeLogin)/bluePeople.png'),
    memberCount: '3/4명',
  };

  // 목 메시지 데이터
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: 1,
        text: '이번 프로젝트에서 팀장을 맡게된 최순조라고 합니다. 반갑습니다.',
        user: '팀장 최순조',
        userImage: require('../../../../assets/images/(beforeLogin)/bluePeople.png'),
        timestamp: '오후 8:51',
        isMe: false,
        readCount: 1,
      },
      {
        id: 2,
        text: '제가 과제 하나 설정해했는데요 확인하시는 대로 답장 부탁드립니다.',
        user: '팀장 최순조',
        userImage: require('../../../../assets/images/(beforeLogin)/bluePeople.png'),
        timestamp: '오후 8:52',
        isMe: false,
        readCount: 1,
      },
      {
        id: 3,
        text: '네 확인했습니다.',
        user: '나',
        timestamp: '오후 8:52',
        isMe: true,
        readCount: 1,
      },
      {
        id: 4,
        text: '비교정치학 책 읽고 3장 요약 하면 되는거 맞겠죠?',
        user: '정치학존잘남',
        userImage: require('../../../../assets/images/(beforeLogin)/purplePeople.png'),
        timestamp: '오후 8:52',
        isMe: false,
        readCount: 1,
      },
      {
        id: 5,
        text: '아니',
        user: '정치학존잘남',
        userImage: require('../../../../assets/images/(beforeLogin)/purplePeople.png'),
        timestamp: '오후 8:54',
        isMe: false,
        readCount: 1,
      },
      {
        id: 6,
        text: '좀 에바긴한데.. 페이지 보셨나요 ㅋㅋㅋ',
        user: '정치학존잘남',
        userImage: require('../../../../assets/images/(beforeLogin)/purplePeople.png'),
        timestamp: '오후 8:54',
        isMe: false,
        readCount: 1,
      },
      {
        id: 7,
        text: '설명 읽으셨는지 모르겠지만 저희 벌칙 있는거 아시죠..?',
        user: '팀장 최순조',
        userImage: require('../../../../assets/images/(beforeLogin)/bluePeople.png'),
        timestamp: '오후 8:55',
        isMe: false,
        readCount: 1,
      },
    ];
    setMessages(mockMessages);
  }, []);

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
    if (inputText.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: inputText.trim(),
        user: '나',
        timestamp: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        isMe: true,
        readCount: 1,
      };
      setMessages([...messages, newMessage]);
      setInputText('');

      // 스크롤을 맨 아래로
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
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
    paddingVertical: 12,
    backgroundColor: '#121216',
    borderTopWidth: 1,
    borderTopColor: '#292929',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#292929',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
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
});
