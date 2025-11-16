import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  subscribeRoomReadBoundary,
  sendTextSock,
  sendImageSock,
  sendFileSock,
  disconnectSock,
  updateSockToken,
  isConnected as isWebSocketConnected,
  waitForConnection,
  type ChatMessage,
  type ReadBoundaryUpdate,
} from '@/src/services/stompClient';
import { UploadProgress } from '@/src/types/file';
import {
  getMessageHistory,
  getUserInfo,
  markRoomAsRead,
  type ChatMessage as ApiChatMessage,
} from '@/src/services/api';
import FileChatBubble from '@/src/components/FileChatBubble';
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
  createdAt?: string; // 날짜 구분선을 위한 생성 시간
}

interface ChatRoomData {
  id: number;
  title: string;
  subtitle: string;
  members: any;
  memberCount: string;
}

export default function ChatRoomScreen() {
  const { id, role, success, members, title, ready } = useLocalSearchParams<{
    id: string;
    role?: string;
    success?: string;
    members?: string;
    title?: string;
    ready?: string;
  }>();
  const [inputText, setInputText] = useState('');
  const [showFileMenu, setShowFileMenu] = useState(false);

  // 텍스트 입력창 높이 계산
  const getInputHeight = (text: string) => {
    const baseHeight = 44; // 기본 높이
    const lineHeight = 22; // 한 줄 높이
    const maxLines = 4; // 최대 줄 수

    if (!text) return baseHeight;

    // 줄바꿈 개수 계산
    const lineBreaks = (text.match(/\n/g) || []).length;
    // 텍스트 길이로 대략적인 줄 수 계산 (한 줄당 약 20자)
    const estimatedLines = Math.ceil(text.length / 20);
    const totalLines = Math.max(lineBreaks + 1, estimatedLines);

    const calculatedHeight =
      baseHeight + Math.min(totalLines - 1, maxLines - 1) * lineHeight;
    return Math.min(calculatedHeight, baseHeight + (maxLines - 1) * lineHeight);
  };
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
  const [showTeamCompleteModal, setShowTeamCompleteModal] = useState(false);
  const [teamCompleteTeamName, setTeamCompleteTeamName] = useState<string>('');
  const listRef = useRef<FlatList<any>>(null);
  // 입력 바(플러스+텍스트박스+전송버튼) 실제 높이 → 리스트 여백에 반영
  const [inputBarHeight, setInputBarHeight] = useState(52);

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
          console.log('👤 멤버 정보 추출:', {
            senderId,
            name: message.sender.name,
            avatarUrl: message.sender.avatarUrl,
            avatarVersion: message.sender.avatarVersion,
          });

          memberMap.set(senderId, {
            memberId: senderId,
            name: message.sender.name || 'Unknown',
            avatarKey: message.sender.avatarUrl || '',
            avatarVersion: message.sender.avatarVersion || 0,
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
      const roomIdNumber = Number(id);

      // NaN 체크
      if (isNaN(roomIdNumber)) {
        console.warn('⚠️ 유효하지 않은 roomId:', id);
        setMessages([]);
        return;
      }

      const historyResponse = await getMessageHistory(roomIdNumber);

      // items 배열이 없거나 유효하지 않은 경우 빈 배열로 처리
      if (!historyResponse || !Array.isArray(historyResponse.items)) {
        console.warn(
          '⚠️ 메시지 히스토리 응답이 유효하지 않음:',
          historyResponse
        );
        setMessages([]);
        return;
      }

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

      // 메시지를 시간순으로 정렬 (오래된 것부터 최신 순)
      const sortedMessages = historyMessages.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });

      setMessages(sortedMessages);

      // 메시지에서 실제 멤버 목록 추출
      const extractedMembers = extractMembersFromMessages(historyMessages);
      setActualMembers(extractedMembers);

      // 히스토리 로드 후 스크롤을 맨 아래로
      setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      }, 200);
    } catch (error) {
      console.log('⚠️ 메시지 히스토리 로드 실패 (무시됨):', error);
      // 결제 완료된 방의 경우 메시지 히스토리 에러를 무시하고 웹소켓 연결은 계속 진행
      // 빈 메시지 배열로 초기화
      setMessages([]);
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

  // role 및 success 정보 로깅 및 팀플 완료 모달 처리
  useEffect(() => {
    if (role) {
      console.log('👑 채팅방에서 사용자 역할:', role);
      console.log('🏠 채팅방 ID:', id);
    }

    if (success !== undefined) {
      const isCompleted = success === 'true';
      setIsTeamCompleted(isCompleted);
      console.log('🏠 채팅방 완료 상태:', isCompleted);

      // 팀플이 완료된 경우 모달 표시 여부 확인
      if (isCompleted) {
        checkAndShowSuccessModal();
      }
    }
  }, [role, id, success]);

  // 팀플 완료 모달 표시 여부 확인 및 표시
  const checkAndShowSuccessModal = async () => {
    try {
      const storageKey = `success_modal_${id}`;
      const hasSeenModal = await AsyncStorage.getItem(storageKey);

      if (!hasSeenModal) {
        // 아직 모달을 보지 않은 경우에만 표시
        console.log('🎉 팀플 완료 모달 표시');
        setTeamCompleteTeamName(
          title ? decodeURIComponent(title) : '정치학 발표'
        );
        setShowTeamCompleteModal(true);

        // 모달을 봤다는 기록 저장
        await AsyncStorage.setItem(storageKey, 'true');
      } else {
        console.log('📝 이미 팀플 완료 모달을 본 채팅방');
      }
    } catch (error) {
      console.error('❌ 팀플 완료 모달 체크 실패:', error);
    }
  };

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
          // 채팅방 읽음 처리 (unreadCount를 0으로 리셋)
          const roomIdNumber = Number(id);
          if (!isNaN(roomIdNumber)) {
            markRoomAsRead(roomIdNumber);
          } else {
            console.warn('⚠️ 유효하지 않은 roomId로 읽음 처리 스킵:', id);
          }

          // 메시지 히스토리 로드 (웹소켓 연결과 병렬로 실행)
          loadMessageHistory();

          // 웹소켓 연결 상태 확인 및 연결 시도
          setConnectionStatus('connecting');
          console.log('🔍 웹소켓 연결 상태 확인 중...');

          if (isWebSocketConnected()) {
            setIsConnected(true);
            setConnectionStatus('connected');
            console.log('✅ 채팅방 진입 - 웹소켓 연결 확인 완료');
          } else {
            console.log('⚠️ 웹소켓 연결되지 않음 - 연결 시도');
            try {
              // 웹소켓 연결 시도
              await connectSock(token);
              const connected = await waitForConnection(5000);
              if (connected) {
                setIsConnected(true);
                setConnectionStatus('connected');
                console.log('✅ 채팅방 진입 - 웹소켓 연결 성공');
              } else {
                setIsConnected(false);
                setConnectionStatus('disconnected');
                console.warn(
                  '⚠️ 웹소켓 연결 타임아웃 - 채팅 기능 제한될 수 있음'
                );
              }
            } catch (error) {
              console.error('❌ 웹소켓 연결 실패:', error);
              setIsConnected(false);
              setConnectionStatus('disconnected');
              // 에러가 발생해도 채팅방은 진입 가능하도록 (히스토리는 볼 수 있음)
            }
          }

          // 메시지 구독 및 읽음 경계 구독 (웹소켓 연결 상태 확인 후)
          setTimeout(() => {
            // 웹소켓 연결 상태 확인
            if (!isWebSocketConnected()) {
              console.warn('⚠️ 웹소켓 연결되지 않음 - 구독하지 않음');
              return;
            }

            console.log('🔔 채팅방 구독 시작 - 방 ID:', Number(id));

            // 메시지 구독
            const messageUnsubscribe = subscribeRoomSock(
              Number(id),
              (message) => {
                console.log('📨 채팅방에서 새 메시지 수신:', message);

                setMessages((prev) => {
                  // 중복 메시지 체크 (messageId로 확인)
                  const isDuplicate = prev.some(
                    (existingMessage) =>
                      existingMessage.messageId === message.messageId
                  );

                  if (isDuplicate) {
                    console.log('📨 중복 메시지 무시:', message.messageId);
                    return prev;
                  }

                  // 새 메시지 추가 후 시간순으로 정렬 (최신 메시지가 아래로)
                  const newMessages = [...prev, message].sort((a, b) => {
                    const timeA = a.createdAt
                      ? new Date(a.createdAt).getTime()
                      : 0;
                    const timeB = b.createdAt
                      ? new Date(b.createdAt).getTime()
                      : 0;
                    return timeA - timeB; // 오름차순 유지 (오래된 것부터)
                  });

                  console.log('📨 새로운 메시지 개수:', newMessages.length);

                  // 새 메시지가 추가되면 자동으로 스크롤을 맨 아래로
                  setTimeout(() => {
                    listRef.current?.scrollToOffset({
                      offset: 0,
                      animated: true,
                    });
                  }, 100);

                  return newMessages;
                });
              }
            );

            // 읽음 경계 구독
            const readUnsubscribe = subscribeRoomReadBoundary(
              Number(id),
              (update) => {
                console.log('📊 읽음 경계 업데이트 수신:', update);
              }
            );

            console.log('🔔 채팅방 구독 완료');

            // 컴포넌트 언마운트 시 정리 (웹소켓 연결은 끊지 않음)
            return () => {
              console.log('🔔 채팅방 구독 해제');
              messageUnsubscribe();
              readUnsubscribe();
            };
          }, 1000);
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

  // messages 배열 안전성 체크
  const safeMessages = Array.isArray(messages) ? messages : [];
  const displayMessages = safeMessages.map((msg: ChatMessage) => {
    console.log('📨 메시지 변환:', {
      messageId: msg.messageId,
      type: msg.type,
      content: msg.content,
      attachments: msg.attachments,
    });

    // attachments를 FileChatBubble에서 사용할 수 있는 형태로 변환
    const formattedAttachments = (msg.attachments || []).map(
      (attachment: any) => ({
        fileId: attachment.fileId,
        name: attachment.name, // attachment.name 사용
        mimeType: attachment.mimeType,
        byteSize: attachment.byteSize, // byteSize 사용
      })
    );

    const isMe = currentUserId !== null && msg.sender?.id === currentUserId;

    return {
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
      createdAt: msg.createdAt || new Date().toISOString(),
      isMe, // 현재 사용자 ID와 비교
      attachments: formattedAttachments, // 파일 첨부 정보 추가
      // readCount: 1, // TODO: 실제 읽음 수 구현 - 주석 처리 (나중에 사용 예정)
    };
  });

  // 백엔드가 허용하는 Content-Type으로 변환하는 함수
  const getValidContentType = (
    originalType: string,
    fileName: string
  ): string => {
    // 백엔드가 허용하는 타입: image/, video/, audio/, application/pdf

    // 이미 image/, video/, audio/로 시작하는 경우 그대로 사용
    if (
      originalType.startsWith('image/') ||
      originalType.startsWith('video/') ||
      originalType.startsWith('audio/') ||
      originalType === 'application/pdf'
    ) {
      return originalType;
    }

    // 파일 확장자로 타입 추정
    const extension = fileName.toLowerCase().split('.').pop();

    switch (extension) {
      // 이미지 파일
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';

      // 비디오 파일
      case 'mp4':
        return 'video/mp4';
      case 'avi':
        return 'video/avi';
      case 'mov':
        return 'video/quicktime';
      case 'wmv':
        return 'video/x-ms-wmv';

      // 오디오 파일
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      case 'aac':
        return 'audio/aac';

      // 문서 파일
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'ppt':
        return 'application/vnd.ms-powerpoint';
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'txt':
        return 'text/plain';
      case 'hwp':
        return 'application/x-hwp';

      // 기본값 (이미지로 처리)
      default:
        console.warn(
          `알 수 없는 파일 타입: ${originalType}, 파일명: ${fileName}. image/jpeg로 처리합니다.`
        );
        return 'image/jpeg';
    }
  };

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
    const readyParam = ready ? `&ready=${ready}` : '';
    router.push(
      `/(tabs)/chats/chat-menu?roomId=${id}&isLeader=${isTeamLeader}&isCompleted=${isTeamCompleted}${membersParam}${titleParam}${readyParam}`
    );
  };

  const handleSendMessage = () => {
    console.log('📤 메시지 전송 버튼 클릭:', {
      inputText: inputText.trim(),
      isConnected,
      connectionStatus,
    });

    if (inputText.trim()) {
      // 연결 상태와 관계없이 메시지 전송 시도
      console.log('📤 메시지 전송 시작:', inputText.trim());
      try {
        const roomIdNumber = Number(id);
        if (isNaN(roomIdNumber)) {
          console.error('❌ 유효하지 않은 roomId:', id);
          Alert.alert('오류', '유효하지 않은 채팅방 ID입니다.');
          return;
        }
        sendTextSock(roomIdNumber, inputText.trim());
        console.log('📤 메시지 전송 완료');
        setInputText('');

        // 스크롤을 맨 아래로
        setTimeout(() => {
          listRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
      } catch (error) {
        console.error('❌ 메시지 전송 실패:', error);
        if (!isConnected) {
          Alert.alert('연결 오류', '웹소켓이 연결되지 않았습니다.');
        }
      }
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
          const validContentType = getValidContentType(
            asset.type || 'image/jpeg',
            asset.fileName || '이미지'
          );
          await uploadAndSendFile(
            asset.uri,
            asset.fileName || '이미지',
            validContentType,
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
          const validContentType = getValidContentType(
            asset.type || 'video/mp4',
            asset.fileName || '동영상'
          );
          await uploadAndSendFile(
            asset.uri,
            asset.fileName || '동영상',
            validContentType,
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
          const validContentType = getValidContentType(
            asset.mimeType || 'application/octet-stream',
            asset.name
          );
          await uploadAndSendFile(
            asset.uri,
            asset.name,
            validContentType,
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

  // 파일 업로드 및 전송 통합 함수 (프론트엔드 방식 적용)
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

      console.log('=== 파일 업로드 Intent 시작 ===');
      console.log('파일 정보:', {
        name: fileName,
        size: fileSize,
        type: contentType,
        uploadType: fileType,
      });
      console.log('백엔드로 전송할 Content-Type:', contentType);

      // JWT 토큰 가져오기
      const token = await getAccessToken();
      if (!token) {
        Alert.alert('오류', '인증 토큰이 없습니다.');
        return;
      }

      // 1. Intent API 요청
      const requestBody = {
        fileName: fileName,
        contentType: contentType,
        size: fileSize,
      };

      const intentResponse = await fetch(
        `https://teamingkr.duckdns.org/api/files/intent/${id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('Intent API 응답 상태:', intentResponse.status);

      if (!intentResponse.ok) {
        const errorText = await intentResponse.text();
        console.error('Intent API 실패:', errorText);
        Alert.alert('업로드 실패', `파일 업로드 준비 실패: ${errorText}`);
        return;
      }

      const intentData = await intentResponse.json();
      console.log('Intent 성공:', intentData);

      // intentData 유효성 검증
      if (!intentData || !intentData.url || !intentData.key) {
        console.error('❌ Intent 응답이 유효하지 않음:', intentData);
        Alert.alert(
          '업로드 실패',
          '파일 업로드 준비 응답이 유효하지 않습니다.'
        );
        return;
      }

      // 2. S3에 파일 업로드
      console.log('=== S3 업로드 시작 ===');

      // 파일을 Blob으로 변환 (프론트엔드와 동일한 방식)
      const response = await fetch(fileUri);
      if (!response.ok) {
        console.error('❌ 파일 읽기 실패:', response.status);
        Alert.alert('업로드 실패', '파일을 읽을 수 없습니다.');
        return;
      }
      const blob = await response.blob();

      const s3UploadResponse = await fetch(intentData.url, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: blob,
      });

      console.log('S3 업로드 응답 상태:', s3UploadResponse.status);

      if (!s3UploadResponse.ok) {
        const errorText = await s3UploadResponse.text();
        console.error('S3 업로드 실패:', errorText);
        Alert.alert('업로드 실패', '파일 업로드에 실패했습니다.');
        return;
      }

      console.log('S3 업로드 성공!');

      // 3. Complete API 호출
      console.log('=== 파일 업로드 확정 시작 ===');
      const completeResponse = await fetch(
        `https://teamingkr.duckdns.org/api/files/complete/${id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            key: intentData.key,
          }),
        }
      );

      console.log('Complete API 응답 상태:', completeResponse.status);

      if (!completeResponse.ok) {
        const errorText = await completeResponse.text();
        console.error('Complete API 실패:', errorText);
        Alert.alert('업로드 실패', '파일 업로드 확정에 실패했습니다.');
        return;
      }

      const completeData = await completeResponse.json();
      console.log('파일 업로드 완료:', completeData);

      // completeData 유효성 검증
      if (!completeData || !completeData.fileId) {
        console.error('❌ Complete 응답이 유효하지 않음:', completeData);
        Alert.alert(
          '업로드 실패',
          '파일 업로드 완료 응답이 유효하지 않습니다.'
        );
        return;
      }

      // roomId 유효성 검증
      const roomIdNumber = Number(id);
      if (isNaN(roomIdNumber)) {
        console.error('❌ 유효하지 않은 roomId:', id);
        Alert.alert('업로드 실패', '유효하지 않은 채팅방 ID입니다.');
        return;
      }

      // 4. 파일 타입에 따라 WebSocket 메시지 타입 결정
      const messageType = fileType === 'image' ? 'IMAGE' : 'FILE';

      // 5. WebSocket으로 파일 메시지 전송 (fileId 배열로 전달)
      if (messageType === 'IMAGE') {
        sendImageSock(roomIdNumber, fileName, [completeData.fileId], fileSize);
      } else {
        sendFileSock(roomIdNumber, fileName, [completeData.fileId], fileSize);
      }

      Alert.alert(
        '전송 완료',
        `파일 "${fileName}"이 성공적으로 업로드되었습니다!`
      );

      // 스크롤을 맨 아래로
      setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
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

  // 날짜 포맷팅 함수 - 항상 전체 날짜 형식만 사용
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const weekdays = [
      '일요일',
      '월요일',
      '화요일',
      '수요일',
      '목요일',
      '금요일',
      '토요일',
    ];
    const weekday = weekdays[date.getDay()];
    return `${date.getFullYear()}년 ${
      date.getMonth() + 1
    }월 ${date.getDate()}일 ${weekday}`;
  };

  // 같은 날짜인지 확인하는 함수
  const isSameDate = (dateString1: string, dateString2: string) => {
    const date1 = new Date(dateString1);
    const date2 = new Date(dateString2);
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const renderMessage = (message: Message, index: number) => {
    // FlatList에 reverse된 배열이 전달되므로, 원본 displayMessages에서 찾아야 함
    // reverse된 배열의 index는: reverseIndex = displayMessages.length - 1 - index
    // 실제 이전 메시지는 원본 배열에서: reverseIndex - 1
    const reverseIndex = displayMessages.length - 1 - index;
    const prevMessage =
      reverseIndex > 0 ? displayMessages[reverseIndex - 1] : null;

    // 날짜가 바뀌는지 확인 (실제 시간 순서대로: 이전 메시지가 더 오래된 메시지)
    const showDateSeparator =
      !prevMessage ||
      !prevMessage.createdAt ||
      !message.createdAt ||
      !isSameDate(prevMessage.createdAt, message.createdAt);

    // 카카오톡과 동일한 로직: 같은 사람 + 같은 시간대 = 연속 메시지
    // prevMessage는 원본 배열에서 찾은 실제 이전 메시지
    const isSameUser = prevMessage
      ? prevMessage.user === message.user && prevMessage.isMe === message.isMe
      : false;
    const isSameTime = prevMessage
      ? prevMessage.timestamp === message.timestamp
      : false;
    const isContinuous = isSameUser && isSameTime;

    // 사용자 정보 표시: 첫 번째 메시지이거나 다른 사람이거나 다른 시간대
    const showUserInfo = !isContinuous && !message.isMe;
    const showTail = !message.isMe && !isContinuous;
    const isFileLike = (message.attachments?.length ?? 0) > 0;

    return (
      <View key={message.id} style={styles.messageContainer}>
        {/* 날짜 구분선 */}
        {showDateSeparator && message.createdAt && (
          <View style={styles.dateSeparator}>
            <Ionicons name="calendar-outline" size={16} color="#666666" />
            <Text style={styles.dateSeparatorText}>
              {formatDate(message.createdAt)}
            </Text>
          </View>
        )}
        {showUserInfo && (
          <View style={styles.userInfo}>
            <Image source={message.userImage} style={styles.userAvatar} />
            <Text style={styles.userName}>{message.user}</Text>
          </View>
        )}

        {isFileLike ? (
          <FileChatBubble
            attachments={message.attachments!}
            isMe={message.isMe}
            showTail={showTail}
            isContinuous={isContinuous}
            timestamp={message.timestamp}
            backgroundColor={message.isMe ? '#007AFF' : '#121216'}
            textColor="#FFFFFF"
          />
        ) : (
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
        )}
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
          <View style={styles.connectionStatus}></View>
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
        <FlatList
          ref={listRef}
          data={[...displayMessages].reverse()}
          inverted
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item, index }) => renderMessage(item, index)}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => {
            // 새 메시지/초기 로딩 때 하단 고정
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
          }}
        />

        {/* 메시지 입력창 */}
        <View
          style={styles.inputContainer}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            // 급격한 튐 방지용 클램프
            setInputBarHeight(Math.max(44, Math.min(140, h)));
          }}
        >
          <TouchableOpacity
            style={styles.plusButton}
            onPress={() => setShowFileMenu(true)}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>

          <TextInput
            style={[styles.textInput, { height: getInputHeight(inputText) }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="메시지를 입력하세요"
            placeholderTextColor="#666666"
            multiline
            maxLength={500}
            textAlignVertical="top"
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
    marginBottom: 7,
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
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 44, // 최소 높이 설정
    maxHeight: 132, // 최대 높이 설정 (3줄 정도)
    marginRight: 12,
  },
  sendButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    marginBottom: 7,
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
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 6,
  },
  dateSeparatorText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
});
