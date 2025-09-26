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
import { getAccessToken } from '@/src/services/tokenManager';
import {
  connectSock,
  subscribeRoomSock,
  sendTextSock,
  sendImageSock,
  sendFileSock,
  disconnectSock,
  updateSockToken,
  type ChatMessage,
} from '@/src/services/stompClient';
import { FileService } from '@/src/services/fileService';
import { UploadProgress } from '@/src/types/file';
import {
  getMessageHistory,
  getUserInfo,
  type ChatMessage as ApiChatMessage,
} from '@/src/services/api';

const { width, height } = Dimensions.get('window');

interface Message {
  id: number;
  text: string;
  user: string;
  userImage?: any;
  timestamp: string;
  isMe: boolean;
  readCount?: number; // 선택적 속성으로 변경 (나중에 사용 예정)
  attachments?: any[]; // 파일 첨부 정보
}

interface ChatRoomData {
  id: number;
  title: string;
  subtitle: string;
  members: any;
  memberCount: string;
}

export default function ChatRoomScreen() {
  const { id, role, success, members, title } = useLocalSearchParams<{
    id: string;
    role?: string;
    success?: string;
    members?: string;
    title?: string;
  }>();
  const [inputText, setInputText] = useState('');
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [jwt, setJwt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [isTeamCompleted, setIsTeamCompleted] = useState(false);
  const [actualMembers, setActualMembers] = useState<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // JWT 토큰에서 사용자 ID 추출하는 함수
  const getUserIdFromToken = (token: string): number | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub ? parseInt(payload.sub) : null;
    } catch (error) {
      console.error('토큰에서 사용자 ID 추출 실패:', error);
      return null;
    }
  };

  // 메시지에서 실제 멤버 목록을 추출하는 함수
  const extractMembersFromMessages = (messages: ChatMessage[]) => {
    const memberMap = new Map<number, any>();

    messages.forEach((message) => {
      if (message.sender && message.sender.id) {
        const senderId = message.sender.id;
        if (!memberMap.has(senderId)) {
          memberMap.set(senderId, {
            memberId: senderId,
            name: message.sender.name || 'Unknown',
            avatarKey: message.sender.avatarUrl || '',
            avatarVersion: 0, // ChatSender에 avatarVersion이 없으므로 기본값 사용
            roomRole:
              senderId === currentUserId && role === 'LEADER'
                ? 'LEADER'
                : 'MEMBER',
          });
        }
      }
    });

    // 팀장을 맨 위로, 나머지는 이름순으로 정렬
    const members = Array.from(memberMap.values()).sort((a, b) => {
      if (a.roomRole === 'LEADER' && b.roomRole !== 'LEADER') return -1;
      if (a.roomRole !== 'LEADER' && b.roomRole === 'LEADER') return 1;
      return a.name.localeCompare(b.name);
    });

    console.log('📋 메시지에서 추출한 실제 멤버 목록:', members);
    return members;
  };

  // 메시지 히스토리 로드 함수
  const loadMessageHistory = async () => {
    if (!id) return;

    try {
      console.log('🚀 메시지 히스토리 로드 시작 - roomId:', id);
      const historyResponse = await getMessageHistory(Number(id));

      // API 응답을 STOMP 메시지 형식으로 변환
      const historyMessages: ChatMessage[] = historyResponse.items.map(
        (apiMessage: ApiChatMessage) => ({
          messageId: apiMessage.messageId,
          roomId: apiMessage.roomId,
          clientMessageId: apiMessage.clientMessageId,
          type: apiMessage.type,
          content: apiMessage.content,
          createdAt: apiMessage.createdAt,
          sender: apiMessage.sender,
          attachments: apiMessage.attachments || [],
        })
      );

      console.log(
        '✅ 메시지 히스토리 로드 완료:',
        historyMessages.length,
        '개'
      );
      setMessages(historyMessages);

      // 메시지에서 실제 멤버 목록 추출
      const extractedMembers = extractMembersFromMessages(historyMessages);
      setActualMembers(extractedMembers);

      // 히스토리 로드 후 스크롤을 맨 아래로
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 200);
    } catch (error) {
      console.error('❌ 메시지 히스토리 로드 실패:', error);
      // 에러가 발생해도 웹소켓 연결은 계속 진행
    }
  };

  // 현재 사용자 정보 로드
  useEffect(() => {
    const loadCurrentUserInfo = async () => {
      try {
        const userInfo = await getUserInfo();
        setCurrentUserName(userInfo.name);
        console.log('👤 현재 사용자 정보:', userInfo);
      } catch (error) {
        console.error('❌ 현재 사용자 정보 로드 실패:', error);
      }
    };

    loadCurrentUserInfo();
  }, []);

  // role 및 success 정보 로깅
  useEffect(() => {
    if (role) {
      console.log('👑 채팅방에서 사용자 역할:', role);
      console.log('🏠 채팅방 ID:', id);
    }

    if (success !== undefined) {
      const isCompleted = success === 'true';
      setIsTeamCompleted(isCompleted);
      console.log('🏠 채팅방 완료 상태:', isCompleted);
    }
  }, [role, id, success]);

  // 채팅방 정보 로드
  useEffect(() => {
    loadChatRoomInfo();
  }, [id, title]);

  const loadChatRoomInfo = async () => {
    try {
      // 실제로는 API에서 채팅방 정보를 가져와야 함
      // 현재는 전달받은 title만 사용
      setChatRoomData((prev) => ({
        ...prev,
        title: title ? decodeURIComponent(title) : '정치학 발표',
        memberCount:
          actualMembers.length > 0 ? `${actualMembers.length}명` : '0',
      }));
    } catch (error) {
      console.error('❌ 채팅방 정보 로드 실패:', error);
    }
  };

  // JWT 토큰 가져오기 및 STOMP 연결
  useEffect(() => {
    const loadTokenAndConnect = async () => {
      try {
        const token = await getAccessToken();
        setJwt(token);
        console.log(
          '✅ JWT 토큰 로드 완료:',
          token ? '토큰 존재' : '토큰 없음'
        );

        // 토큰에서 사용자 ID 추출
        if (token) {
          const userId = getUserIdFromToken(token);
          setCurrentUserId(userId);
          console.log('👤 현재 사용자 ID:', userId);
        }

        if (token) {
          // 메시지 히스토리 로드 (웹소켓 연결과 병렬로 실행)
          loadMessageHistory();

          // SockJS 연결 시작
          setConnectionStatus('connecting');

          try {
            await connectSock(token);

            // connectSock이 성공했다면 연결된 것으로 간주
            setIsConnected(true);
            setConnectionStatus('connected');
            console.log('✅ SockJS 연결 성공');

            // 채팅방 구독 (연결 완료 후 약간의 지연)
            setTimeout(() => {
              console.log('🔔 구독 시작 - 방 ID:', Number(id));
              const unsubscribe = subscribeRoomSock(Number(id), (message) => {
                console.log('📨 새 메시지 수신:', message);
                console.log('📨 메시지 타입:', typeof message);
                console.log(
                  '📨 메시지 내용:',
                  JSON.stringify(message, null, 2)
                );
                setMessages((prev) => {
                  console.log('📨 이전 메시지 개수:', prev.length);

                  // 중복 메시지 체크 (messageId로 확인)
                  const isDuplicate = prev.some(
                    (existingMessage) =>
                      existingMessage.messageId === message.messageId
                  );

                  if (isDuplicate) {
                    console.log('📨 중복 메시지 무시:', message.messageId);
                    return prev;
                  }

                  // 새 메시지 추가 후 시간순으로 정렬
                  const newMessages = [...prev, message].sort((a, b) => {
                    const timeA = a.createdAt
                      ? new Date(a.createdAt).getTime()
                      : 0;
                    const timeB = b.createdAt
                      ? new Date(b.createdAt).getTime()
                      : 0;
                    return timeA - timeB;
                  });

                  console.log('📨 새로운 메시지 개수:', newMessages.length);

                  // 새 메시지가 추가되면 자동으로 스크롤을 맨 아래로
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 100);

                  return newMessages;
                });
              });
              console.log('🔔 구독 함수 반환됨');

              // 컴포넌트 언마운트 시 정리
              return () => {
                console.log('🔔 구독 해제');
                unsubscribe();
                disconnectSock();
              };
            }, 1000);
          } catch (error) {
            console.error('SockJS 연결 실패:', error);
            setConnectionStatus('error');
            throw error;
          }
        }
      } catch (error) {
        console.error('토큰 로드 또는 연결 실패:', error);
        setConnectionStatus('error');
        Alert.alert(
          '오류',
          '인증 토큰을 가져올 수 없거나 연결에 실패했습니다.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadTokenAndConnect();
  }, [id]);

  // 채팅방 데이터 - 실제 API에서 가져올 데이터
  const [chatRoomData, setChatRoomData] = useState<ChatRoomData>({
    id: Number(id),
    title: title ? decodeURIComponent(title) : '정치학 발표',
    subtitle: '정치학개론',
    members: null,
    memberCount: '0',
  });

  // 메시지 목록을 표시용 메시지로 변환
  console.log('🔄 현재 메시지 개수:', messages.length);
  console.log('🔄 현재 메시지들:', messages);
  console.log('👤 현재 사용자 ID:', currentUserId);
  const displayMessages = messages.map((msg: ChatMessage) => ({
    id: msg.messageId || 0,
    text: msg.content || '',
    user: msg.sender?.name || 'Unknown',
    userImage: msg.sender?.avatarUrl ? { uri: msg.sender.avatarUrl } : null,
    timestamp: msg.createdAt
      ? new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
    isMe: currentUserId !== null && msg.sender?.id === currentUserId, // 현재 사용자 ID와 비교
    attachments: msg.attachments || [], // 파일 첨부 정보 추가
    // readCount: 1, // TODO: 실제 읽음 수 구현 - 주석 처리 (나중에 사용 예정)
  }));

  const handleBackPress = () => {
    // 좌측 슬라이드 애니메이션으로 뒤로가기
    router.back();
  };

  const handleMenuPress = () => {
    // URL 파라미터에서 팀장 여부 확인
    const isTeamLeader = role === 'LEADER';

    // 실제 멤버 정보를 전달 (메시지에서 추출한 정보 우선 사용)
    let membersToPass = actualMembers;
    if (membersToPass.length === 0 && members) {
      // actualMembers가 없으면 기존 members 사용
      try {
        membersToPass = JSON.parse(decodeURIComponent(members as string));
      } catch (error) {
        console.error('❌ members 파싱 실패:', error);
        membersToPass = [];
      }
    }

    const membersParam =
      membersToPass.length > 0
        ? `&members=${encodeURIComponent(JSON.stringify(membersToPass))}`
        : '';
    const titleParam = title ? `&title=${encodeURIComponent(title)}` : '';
    router.push(
      `/(tabs)/chats/chat-menu?roomId=${id}&isLeader=${isTeamLeader}&isCompleted=${isTeamCompleted}${membersParam}${titleParam}`
    );
  };

  const handleSendMessage = () => {
    console.log('📤 메시지 전송 버튼 클릭:', {
      inputText: inputText.trim(),
      isConnected,
      connectionStatus,
    });

    if (inputText.trim() && isConnected) {
      // SockJS 클라이언트로 메시지 전송
      console.log('📤 메시지 전송 시작:', inputText.trim());
      sendTextSock(Number(id), inputText.trim());
      console.log('📤 메시지 전송 완료');
      setInputText('');

      // 스크롤을 맨 아래로
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else if (!isConnected) {
      Alert.alert('연결 오류', '웹소켓이 연결되지 않았습니다.');
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
          await uploadAndSendFile(
            asset.uri,
            asset.fileName || '이미지',
            asset.type || 'image/jpeg',
            asset.fileSize || 0,
            'image'
          );
        } else {
          Alert.alert('연결 오류', '웹소켓이 연결되지 않았습니다.');
        }
        setShowFileMenu(false);
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
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
          await uploadAndSendFile(
            asset.uri,
            asset.fileName || '동영상',
            asset.type || 'video/mp4',
            asset.fileSize || 0,
            'video'
          );
        } else {
          Alert.alert('연결 오류', '웹소켓이 연결되지 않았습니다.');
        }
        setShowFileMenu(false);
      }
    } catch (error) {
      console.error('동영상 선택 오류:', error);
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
          await uploadAndSendFile(
            asset.uri,
            asset.name,
            asset.mimeType || 'application/octet-stream',
            asset.size || 0,
            'document'
          );
        } else {
          Alert.alert('연결 오류', '웹소켓이 연결되지 않았습니다.');
        }
        setShowFileMenu(false);
      }
    } catch (error) {
      console.error('문서 선택 오류:', error);
      Alert.alert('오류', '파일을 선택하는 중 오류가 발생했습니다.');
    }
  };

  // 파일 업로드 및 전송 통합 함수
  const uploadAndSendFile = async (
    fileUri: string,
    fileName: string,
    contentType: string,
    fileSize: number,
    fileType: 'image' | 'video' | 'document'
  ) => {
    try {
      setIsUploading(true);
      setUploadProgress({ loaded: 0, total: fileSize, percentage: 0 });

      console.log('📤 파일 업로드 시작:', {
        fileName,
        contentType,
        fileSize: FileService.formatFileSize(fileSize),
        fileType,
      });

      // S3에 파일 업로드
      const fileId = await FileService.uploadFile(
        Number(id),
        fileUri,
        fileName,
        contentType,
        fileSize,
        (progress) => {
          setUploadProgress(progress);
          console.log(`📊 업로드 진행률: ${progress.percentage.toFixed(1)}%`);
        }
      );

      console.log('✅ 파일 업로드 완료, fileId:', fileId);

      // SockJS 클라이언트로 파일 메시지 전송
      if (fileType === 'image') {
        sendImageSock(Number(id), fileName, [fileId]);
      } else if (fileType === 'video') {
        sendFileSock(Number(id), fileName, [fileId]);
      } else {
        sendFileSock(Number(id), fileName, [fileId]);
      }

      Alert.alert('전송 완료', `${fileName}이(가) 전송되었습니다.`);

      // 스크롤을 맨 아래로
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('❌ 파일 업로드 실패:', error);
      Alert.alert(
        '업로드 실패',
        `파일 업로드 중 오류가 발생했습니다.\n${
          error.message || '알 수 없는 오류'
        }`
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const prevMessage = index > 0 ? displayMessages[index - 1] : null;

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
          attachments={message.attachments}
          // readCount={message.readCount} // 주석 처리 (나중에 사용 예정)
          backgroundColor={message.isMe ? '#007AFF' : '#121216'}
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
                : connectionStatus === 'connecting'
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
          {displayMessages.map((message, index) =>
            renderMessage(message, index)
          )}
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
                disabled={isUploading}
              >
                <View style={styles.fileMenuIcon}>
                  <Ionicons name="image" size={24} color="#FF2D92" />
                </View>
                <Text style={styles.fileMenuText}>이미지</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fileMenuOption}
                onPress={handleVideoPicker}
                disabled={isUploading}
              >
                <View style={styles.fileMenuIcon}>
                  <Ionicons name="videocam" size={24} color="#AF52DE" />
                </View>
                <Text style={styles.fileMenuText}>동영상</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fileMenuOption}
                onPress={handleDocumentPicker}
                disabled={isUploading}
              >
                <View style={styles.fileMenuIcon}>
                  <Ionicons name="document" size={24} color="#007AFF" />
                </View>
                <Text style={styles.fileMenuText}>파일</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 업로드 진행률 모달 */}
        <Modal visible={isUploading} transparent={true} animationType="fade">
          <View style={styles.uploadModalOverlay}>
            <View style={styles.uploadModalContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.uploadModalTitle}>파일 업로드 중...</Text>
              {uploadProgress && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${uploadProgress.percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {uploadProgress.percentage.toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
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
    backgroundColor: '#000000', // 헤더 배경색을 검은색으로 설정
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

  // 업로드 진행률 모달
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModalContainer: {
    backgroundColor: '#121216',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#292929',
  },
  uploadModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#292929',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
  },
});
