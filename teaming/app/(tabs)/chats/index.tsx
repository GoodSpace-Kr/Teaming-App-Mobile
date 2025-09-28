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
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Linking } from 'react-native';
import { getChatRooms, ChatRoom } from '../../../src/services/chatService';
import { useWebSocket } from '../../../src/hooks/useWebSocket';
import { getAccessToken } from '../../../src/services/tokenManager';
import { subscribeRoomSock } from '../../../src/services/stompClient';
import { createPayment } from '../../../src/services/api';

const { width } = Dimensions.get('window');
export default function ChatsScreen() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [jwt, setJwt] = useState<string | null>(null);

  // 결제 관련 상태
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [showPaymentFailureModal, setShowPaymentFailureModal] = useState(false);
  const [shouldRenderWebView, setShouldRenderWebView] = useState(true);
  const [paymentTimer, setPaymentTimer] = useState<number | null>(null);

  // JWT 토큰 가져오기
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await getAccessToken();
        setJwt(token);
      } catch (error) {
        console.error('토큰 로드 실패:', error);
      }
    };
    loadToken();
  }, []);

  // 웹소켓 연결 (전체 채팅방 목록 업데이트용)
  const { isConnected } = useWebSocket({
    jwt: jwt || '',
    autoConnect: !!jwt,
  });

  // 웹소켓을 통한 실시간 메시지 수신 및 lastMessage 업데이트
  useEffect(() => {
    if (!jwt || !isConnected) return;

    // 모든 채팅방에 대해 웹소켓 구독
    const unsubscribes: (() => void)[] = [];

    chatRooms.forEach((room) => {
      const unsubscribe = subscribeRoomSock(room.roomId, (message) => {
        console.log('📨 채팅방 목록에서 메시지 수신:', message);

        // 해당 채팅방의 lastMessage 업데이트
        setChatRooms((prevRooms) =>
          prevRooms.map((prevRoom) => {
            if (prevRoom.roomId === room.roomId) {
              const lastMessage = {
                id: message.messageId || 0,
                type: (message.type === 'VIDEO' || message.type === 'AUDIO'
                  ? 'FILE'
                  : message.type || 'TEXT') as 'TEXT' | 'IMAGE' | 'FILE',
                content: message.content || '',
                sender: (message.sender || {
                  id: 0,
                  name: 'Unknown',
                  avatarUrl: '',
                  avatarVersion: 0,
                }) as any,
                createdAt: message.createdAt || new Date().toISOString(),
              };
              return { ...prevRoom, lastMessage };
            }
            return prevRoom;
          })
        );
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [jwt, isConnected, chatRooms]);

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

  // 결제 처리 함수
  const handlePayment = async (room: any) => {
    try {
      console.log('🚀 결제 시작:', room);

      // 결제 금액 계산: price * (memberCount - 1)
      const paymentAmount = room.type.price * (room.memberCount - 1);

      console.log('💰 결제 금액 계산:', {
        price: room.type.price,
        memberCount: room.memberCount,
        paymentAmount: paymentAmount,
      });

      // 결제 API 호출
      const paymentHtmlResponse = await createPayment(
        room.roomId,
        paymentAmount
      );

      // 백엔드에서 받은 HTML을 그대로 사용 (수정하지 않음)
      const modifiedHtml = paymentHtmlResponse;

      setSelectedRoom(room);
      setPaymentHtml(modifiedHtml);
      setShowPaymentModal(true);
    } catch (error) {
      console.error('❌ 결제 API 실패:', error);
      Alert.alert('결제 실패', '결제 요청 중 오류가 발생했습니다.');
    }
  };

  // 결제 모달 닫기
  const handlePaymentModalClose = () => {
    // 타이머 정리
    if (paymentTimer) {
      clearTimeout(paymentTimer);
      setPaymentTimer(null);
    }

    setShowPaymentModal(false);
    setPaymentHtml('');
    setSelectedRoom(null);
    setShouldRenderWebView(true); // WebView 렌더링 상태 초기화
  };

  // 결제 성공 처리
  const handlePaymentSuccess = async () => {
    console.log('✅ 결제 성공 - 웹뷰 모달 즉시 닫기');

    // 1. 먼저 웹뷰 모달을 즉시 닫기
    setShowPaymentModal(false);
    setPaymentHtml('');
    setSelectedRoom(null);

    // 2. 서버 상태 업데이트를 위해 잠시 대기
    console.log('⏳ 서버 상태 업데이트 대기 중...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. 채팅방 목록 새로고침
    await fetchChatRooms();

    // 4. 성공 모달 표시
    setShowPaymentSuccessModal(true);
  };

  // 결제 실패 처리
  const handlePaymentFailure = () => {
    console.log('❌ 결제 실패 - 웹뷰 모달 즉시 닫기');

    // 1. 먼저 웹뷰 모달을 즉시 닫기
    setShowPaymentModal(false);
    setPaymentHtml('');
    setSelectedRoom(null);

    // 2. 실패 모달 표시
    setShowPaymentFailureModal(true);
  };

  // 결제 성공 모달 확인 버튼
  const handlePaymentSuccessConfirm = () => {
    setShowPaymentSuccessModal(false);

    // 결제한 채팅방으로 이동
    if (selectedRoom) {
      console.log('🚀 결제 완료된 방으로 이동:', selectedRoom.roomId);
      const membersParam = encodeURIComponent(
        JSON.stringify(selectedRoom.members)
      );
      const titleParam = encodeURIComponent(selectedRoom.title);
      router.push(
        `/(tabs)/chats/chat-room/${selectedRoom.roomId}?role=${selectedRoom.role}&success=${selectedRoom.success}&members=${membersParam}&title=${titleParam}`
      );
    }
  };

  // 결제 실패 모달 확인 버튼
  const handlePaymentFailureConfirm = () => {
    setShowPaymentFailureModal(false);
    // 채팅방 목록에 그대로 머무름 (별도 라우팅 없음)
  };

  const handleEnterChatRoom = (
    roomId: number,
    role: 'LEADER' | 'MEMBER',
    success: boolean,
    members: any[],
    title: string,
    paymentStatus: string,
    roomType: any,
    memberCount: number
  ) => {
    // 결제가 필요한 경우 결제 웹뷰 표시
    if (paymentStatus === 'NOT_PAID') {
      const room = {
        roomId,
        role,
        success,
        members,
        title,
        paymentStatus,
        type: roomType,
        memberCount: memberCount,
      };
      handlePayment(room);
      return;
    }

    // 결제 완료된 경우 채팅방으로 이동
    const membersParam = encodeURIComponent(JSON.stringify(members));
    const titleParam = encodeURIComponent(title);
    router.push(
      `/(tabs)/chats/chat-room/${roomId}?role=${role}&success=${success}&members=${membersParam}&title=${titleParam}`
    );
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
          chatRooms.map((room) => {
            console.log(`🏠 채팅방 ${room.roomId}:`, {
              title: room.title,
              avatarUrl: room.avatarUrl,
              memberCount: room.memberCount,
            });

            return (
              <View key={room.roomId} style={styles.chatRoomCard}>
                <TouchableOpacity
                  style={styles.chatRoomContent}
                  onPress={() =>
                    handleEnterChatRoom(
                      room.roomId,
                      room.role,
                      room.success,
                      room.members,
                      room.title,
                      room.paymentStatus,
                      room.type,
                      room.memberCount
                    )
                  }
                >
                  <View style={styles.chatRoomContent}>
                    {/* 채팅방 아이콘 */}
                    <View style={styles.roomIconContainer}>
                      {room.avatarUrl ? (
                        <Image
                          source={{ uri: room.avatarUrl }}
                          style={styles.roomIcon}
                          defaultSource={require('../../../assets/images/(beforeLogin)/bluePeople.png')}
                          onError={() => {
                            console.log(
                              '채팅방 아바타 이미지 로드 실패, 기본 아이콘으로 대체'
                            );
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
                        <View style={styles.titleContainer}>
                          <Text style={styles.roomTitle} numberOfLines={1}>
                            {room.title}
                          </Text>
                          {room.success && (
                            <View style={styles.completionBadge}>
                              <Ionicons
                                name="checkmark"
                                size={14}
                                color="#FFFFFF"
                              />
                            </View>
                          )}
                        </View>
                      </View>

                      {room.lastMessage ? (
                        <Text style={styles.lastMessage} numberOfLines={1}>
                          {room.lastMessage.sender.name}:{' '}
                          {room.lastMessage.content}
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

                {/* 결제 상태 표시 - 결제가 필요한 경우에만 카드 모양 표시 */}
                {room.paymentStatus === 'NOT_PAID' && (
                  <View style={styles.paymentStatusCard}>
                    <Ionicons name="card" size={20} color="#FFD700" />
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 결제 모달 */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handlePaymentModalClose}
      >
        <View style={styles.paymentModalContainer}>
          <View style={styles.paymentModalHeader}>
            <Text style={styles.paymentModalTitle}>결제하기</Text>
            <TouchableOpacity
              style={styles.paymentModalCloseButton}
              onPress={handlePaymentModalClose}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {paymentHtml && shouldRenderWebView && (
            <WebView
              source={{ html: paymentHtml }}
              style={styles.paymentWebView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
              onLoadStart={() => {
                console.log('🌐 웹뷰 로딩 시작');
              }}
              onLoadEnd={() => {
                console.log('🌐 웹뷰 로딩 완료');
              }}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('❌ 웹뷰 에러:', nativeEvent);
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.log('🌐 HTTP 응답 상태:', nativeEvent.statusCode);
                console.log('🌐 HTTP 응답 URL:', nativeEvent.url);
                // HTTP 에러는 로그만 출력 (Deep Link로 결제 결과 처리)
              }}
              onShouldStartLoadWithRequest={(request) => {
                console.log('🌐 웹뷰 로드 요청:', request.url);

                // teaming:// URL 감지 시 즉시 차단하고 처리
                if (request.url.startsWith('teaming://payment/')) {
                  console.log('📱 결제 결과 Deep Link 감지:', request.url);

                  // 타이머 정리 (Deep Link가 먼저 감지된 경우)
                  if (paymentTimer) {
                    clearTimeout(paymentTimer);
                    setPaymentTimer(null);
                    console.log('⏰ 기존 타이머 정리됨 (Deep Link 우선 처리)');
                  }

                  // WebView 렌더링 즉시 중단
                  setShouldRenderWebView(false);

                  if (request.url.includes('/success')) {
                    console.log('✅ 결제 성공 감지 - 웹뷰 렌더링 중단');
                    handlePaymentSuccess();
                  } else if (request.url.includes('/fail')) {
                    console.log('❌ 결제 실패 감지 - 웹뷰 렌더링 중단');
                    handlePaymentFailure();
                  }
                  return false; // URL 로드 차단
                }

                return true; // 다른 URL은 정상 로드 허용
              }}
              onNavigationStateChange={(navState) => {
                console.log('🌐 웹뷰 네비게이션:', navState.url);
                console.log('🌐 로딩 상태:', navState.loading);

                // 결제 진행 상황 로그만 출력
                if (navState.url.includes('/api/payment/request')) {
                  console.log('🔄 백엔드 결제 처리 중:', navState.url);

                  // 기존 타이머가 있다면 정리
                  if (paymentTimer) {
                    clearTimeout(paymentTimer);
                  }

                  // 2초 후 자동으로 결제 성공 처리
                  console.log('⏰ 2초 후 자동 결제 성공 처리 시작');
                  const timer = setTimeout(() => {
                    console.log('✅ 타이머 기반 결제 성공 처리');
                    handlePaymentSuccess();
                  }, 2000);

                  setPaymentTimer(timer);
                }
                if (navState.url.includes('sandbox-pay.nicepay.co.kr')) {
                  console.log('💳 NicePay 결제 화면 로드됨:', navState.url);
                }
              }}
              onMessage={(event) => {
                // 웹뷰에서 메시지 받기 (필요시에만)
                console.log('📨 웹뷰 메시지:', event.nativeEvent.data);
              }}
            />
          )}
        </View>
      </Modal>

      {/* 결제 성공 모달 */}
      <Modal
        visible={showPaymentSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPaymentSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultModalContainer}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            </View>
            <Text style={styles.resultModalTitle}>결제 완료!</Text>
            <Text style={styles.resultModalMessage}>
              결제가 성공적으로 완료되었습니다.
            </Text>
            <TouchableOpacity
              style={styles.resultModalButton}
              onPress={handlePaymentSuccessConfirm}
            >
              <Text style={styles.resultModalButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 결제 실패 모달 */}
      <Modal
        visible={showPaymentFailureModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPaymentFailureModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultModalContainer}>
            <View style={styles.failureIconContainer}>
              <Ionicons name="close-circle" size={64} color="#FF6B6B" />
            </View>
            <Text style={styles.resultModalTitle}>결제 실패</Text>
            <Text style={styles.resultModalMessage}>
              결제에 실패했습니다. 다시 시도해주세요.
            </Text>
            <TouchableOpacity
              style={styles.resultModalButton}
              onPress={handlePaymentFailureConfirm}
            >
              <Text style={styles.resultModalButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    position: 'relative',
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
    alignItems: 'center',
    marginBottom: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completionBadge: {
    width: 16,
    height: 16,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    marginBottom: 5,
    justifyContent: 'center',
    marginLeft: 8,
  },

  timeContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // 결제 상태 카드
  paymentStatusCard: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  // 결제 모달
  paymentModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  paymentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#292929',
  },
  paymentModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  paymentModalCloseButton: {
    padding: 8,
  },
  paymentWebView: {
    flex: 1,
  },

  // 결제 결과 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultModalContainer: {
    backgroundColor: '#121216',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
    minWidth: 280,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  failureIconContainer: {
    marginBottom: 16,
  },
  resultModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultModalMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  resultModalButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  resultModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
