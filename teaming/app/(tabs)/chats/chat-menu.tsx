import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import CompleteTeamModal from './complete-team-modal';
import TeamCompletionSuccessModal from './team-completion-success-modal';
import * as apiService from '@/src/services/api';
import { getUserInfo, getRoomInviteCode } from '@/src/services/api';

const { width } = Dimensions.get('window');

interface Participant {
  id: number;
  name: string;
  avatar: any;
  isMe: boolean;
}

export default function ChatMenuScreen() {
  const { roomId, isLeader, isCompleted, members, title, ready } =
    useLocalSearchParams();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [isLoadingInviteCode, setIsLoadingInviteCode] = useState(false);

  // 팀장 여부 확인 (실제로는 API에서 가져올 데이터)
  const isTeamLeader = isLeader === 'true';
  // 팀플 완료 상태 확인
  const isTeamCompleted = isCompleted === 'true';

  // 현재 사용자 정보 로드
  React.useEffect(() => {
    const loadCurrentUserInfo = async () => {
      try {
        const userInfo = await getUserInfo();
        setCurrentUserName(userInfo.name);
        console.log('👤 chat-menu 현재 사용자 정보:', userInfo);
      } catch (error) {
        console.error('❌ 현재 사용자 정보 로드 실패:', error);
      }
    };

    loadCurrentUserInfo();
  }, []);

  // members 정보를 파싱하여 참가자 목록 생성
  const participants: Participant[] = React.useMemo(() => {
    console.log('🔍 상단 메뉴 - members 파라미터:', members);

    if (!members) {
      console.log('❌ members 정보가 없음');
      // members 정보가 없으면 빈 목록 반환
      return [];
    }

    try {
      const membersData = JSON.parse(decodeURIComponent(members as string));
      console.log('📋 상단 메뉴 - 파싱된 members 데이터:', membersData);

      return membersData.map((member: any, index: number) => {
        const isMe = member.name === currentUserName;
        console.log(`👤 멤버 ${index + 1}:`, {
          memberId: member.memberId,
          name: member.name,
          avatarKey: member.avatarKey,
          avatarUrl: member.avatarUrl,
          roomRole: member.roomRole,
          isMe: isMe,
        });

        return {
          id: member.memberId,
          name:
            member.roomRole === 'LEADER' ? `${member.name}(팀장)` : member.name,
          avatar: member.avatarUrl
            ? { uri: member.avatarUrl }
            : member.avatarKey
            ? { uri: member.avatarKey }
            : null,
          isMe,
        };
      });
    } catch (error) {
      console.error('❌ members 파싱 실패:', error);
      // 파싱 실패 시 빈 목록 반환
      return [];
    }
  }, [members, currentUserName]);

  const handleBackPress = () => {
    router.back();
  };

  const handleDataRoom = () => {
    // members 정보를 자료실로 전달
    const membersParam = members
      ? `&members=${encodeURIComponent(members as string)}`
      : '';
    const titleParam = title
      ? `&title=${encodeURIComponent(title as string)}`
      : '';
    router.push(
      `/(tabs)/chats/data-room/${roomId}?${membersParam}${titleParam}`
    );
  };

  const handleCreateTask = () => {
    // participants 데이터를 과제 생성하기로 전달
    const participantsData = participants.map((participant) => ({
      memberId: participant.id,
      name: participant.name.replace('(팀장)', ''), // 팀장 표시 제거
      avatarUrl: participant.avatar?.uri || '',
      avatarKey: participant.avatar?.uri || '',
      roomRole: participant.name.includes('(팀장)') ? 'LEADER' : 'MEMBER',
    }));

    const membersParam =
      participantsData.length > 0
        ? `&members=${encodeURIComponent(JSON.stringify(participantsData))}`
        : '';

    console.log('🚀 과제 생성하기로 전달할 멤버 데이터:', participantsData);
    router.push(`/(tabs)/chats/create-task?roomId=${roomId}${membersParam}`);
  };

  const handleViewTasks = () => {
    // 과제 목록 화면으로 이동
    const isLeaderParam = isLeader ? `&isLeader=${isLeader}` : '';
    router.push(`/(tabs)/chats/task-list?roomId=${roomId}${isLeaderParam}`);
  };

  const handleLeaveRoom = () => {
    // 팀밍룸 나가기 모달 표시
    setShowLeaveModal(true);
  };

  const handleConfirmLeave = async () => {
    if (!roomId) return;

    try {
      // 모달 닫기
      setShowLeaveModal(false);

      console.log('🚀 방 떠나기 API 호출 - roomId:', roomId);

      // 방 떠나기 API 호출
      await apiService.leaveRoom(Number(roomId));

      console.log('✅ 방 떠나기 성공');

      // 성공 시 홈 화면으로 이동
      router.push('/(tabs)/home');
    } catch (error: any) {
      console.error('❌ 방 떠나기 실패:', error);

      // 에러 발생 시 사용자에게 알림
      Alert.alert(
        '오류',
        '방을 떠나는 중 오류가 발생했습니다.\n다시 시도해주세요.',
        [{ text: '확인' }]
      );
    }
  };

  const handleCancelLeave = () => {
    // 모달 닫기
    setShowLeaveModal(false);
  };

  const handleCompleteTeam = () => {
    // 팀플 완료 모달 표시
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = async () => {
    if (!roomId || isCompleting) return;

    try {
      setIsCompleting(true);
      setShowCompleteModal(false);

      console.log('🔍 apiService 확인:', apiService);
      console.log(
        '🔍 completeTeamProject 함수 확인:',
        typeof apiService.completeTeamProject
      );
      console.log('🔍 roomId:', roomId, 'Number(roomId):', Number(roomId));

      // PATCH API 요청으로 팀플 완료 처리
      if (typeof apiService.completeTeamProject === 'function') {
        await apiService.completeTeamProject(Number(roomId));
      } else {
        // 직접 API 호출로 대체
        console.log('🔄 직접 API 호출로 대체');
        const response = await apiService.default.patch(
          `/rooms/${roomId}/success`
        );
        console.log('✅ 직접 API 호출 성공:', response.data);
      }

      // 결제 취소 API 호출
      try {
        console.log('💳 결제 취소 API 호출 시작:', { roomId });
        const cancelResponse = await apiService.default.post(
          `/payment/cancelAuth`,
          { roomId: Number(roomId) },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('✅ 결제 취소 API 호출 성공:', cancelResponse.data);
      } catch (cancelError: any) {
        console.error('❌ 결제 취소 API 호출 실패:', cancelError);
        // 결제 취소 실패해도 팀플 완료는 진행되도록 함
        console.log('⚠️ 결제 취소 실패했지만 팀플 완료는 계속 진행');
      }

      // 성공 모달 표시
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('팀플 완료 실패:', error);
      Alert.alert(
        '오류',
        '팀플 완료 처리 중 오류가 발생했습니다.\n다시 시도해주세요.',
        [{ text: '확인' }]
      );
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancelComplete = () => {
    // 모달 닫기
    setShowCompleteModal(false);
  };

  const handleSuccessModalClose = () => {
    // 성공 모달 닫기 후 홈 화면으로 이동
    setShowSuccessModal(false);
    router.push('/(tabs)/home');
  };

  // 초대코드 조회 함수
  const handleInviteCode = async () => {
    if (!roomId) return;

    try {
      setIsLoadingInviteCode(true);
      console.log('🚀 초대코드 조회 - roomId:', roomId);
      const response = await getRoomInviteCode(Number(roomId));
      setInviteCode(response.inviteCode);
      setShowInviteModal(true);
      console.log('✅ 초대코드 조회 성공:', response.inviteCode);
    } catch (error) {
      console.error('❌ 초대코드 조회 실패:', error);
      Alert.alert('오류', '초대코드를 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingInviteCode(false);
    }
  };

  // 초대코드 모달 닫기
  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
    setInviteCode('');
  };

  // 초대코드 복사 함수
  const handleCopyInviteCode = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert('복사 완료', '초대코드가 클립보드에 복사되었습니다.');
    } catch (error) {
      console.error('❌ 초대코드 복사 실패:', error);
      Alert.alert('오류', '초대코드 복사에 실패했습니다.');
    }
  };

  // 인원이 다 찼는지 확인하는 함수
  const isRoomFull = () => {
    if (!ready) return false;

    try {
      const readyData = JSON.parse(decodeURIComponent(ready as string));
      return readyData.everyMemberEntered === true;
    } catch (error) {
      console.error('❌ ready 파싱 실패:', error);
      return false;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerRight} />
      </View>

      {/* 채팅방 정보 */}
      <View style={styles.roomInfo}>
        <View style={styles.roomIcon}>
          <Ionicons name="people" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.headerTitle}>
          {title ? decodeURIComponent(title as string) : '정치학 발표'}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 자료실/과제 섹션 */}
        <View style={styles.section}>
          {/* 초대코드 섹션 - 팀장이고 인원이 다 차지 않은 경우에만 표시 */}
          {isTeamLeader && !isRoomFull() && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleInviteCode}
              disabled={isLoadingInviteCode}
            >
              <View style={styles.menuIcon}>
                <Ionicons name="link" size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.menuText}>
                {isLoadingInviteCode ? '초대코드 조회 중...' : '초대코드'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={handleDataRoom}>
            <View style={styles.menuIcon}>
              <Ionicons name="folder" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.menuText}>자료실</Text>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          {isTeamLeader ? (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleCreateTask}
            >
              <View style={styles.menuIcon}>
                <Ionicons name="add-circle" size={24} color="#007AFF" />
              </View>
              <Text style={styles.menuText}>과제 생성하기</Text>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.menuItem} onPress={handleViewTasks}>
              <View style={styles.menuIcon}>
                <Ionicons name="document-text" size={24} color="#007AFF" />
              </View>
              <Text style={styles.menuText}>과제방</Text>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>
          )}

          {isTeamLeader && (
            <TouchableOpacity style={styles.menuItem} onPress={handleViewTasks}>
              <View style={styles.menuIcon}>
                <Ionicons name="document-text" size={24} color="#007AFF" />
              </View>
              <Text style={styles.menuText}>과제방</Text>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>
          )}
        </View>

        {/* 대화상대 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            대화상대 {participants.length}
          </Text>
          {participants.length === 0 ? (
            <View style={styles.emptyParticipants}>
              <Text style={styles.emptyParticipantsText}>
                참가자 정보를 불러올 수 없습니다.
              </Text>
            </View>
          ) : (
            participants.map((participant) => (
              <View key={participant.id} style={styles.participantItem}>
                <Image
                  source={participant.avatar}
                  style={styles.participantAvatar}
                />
                <View style={styles.nameContainer}>
                  {participant.isMe && (
                    <View style={styles.meBadge}>
                      <Text style={styles.meText}>나</Text>
                    </View>
                  )}
                  <Text style={styles.participantName}>{participant.name}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 팀플 완료 또는 나가기 */}
        <View style={styles.section}>
          {isTeamCompleted ? (
            // 팀플 완료 후 - 모든 사용자가 방을 떠날 수 있음
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={handleLeaveRoom}
            >
              <View style={styles.leaveIcon}>
                <Ionicons name="exit" size={24} color="#FF3B30" />
              </View>
              <Text style={styles.leaveText}>티밍룸 나가기</Text>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>
          ) : isTeamLeader ? (
            // 팀플 완료 전 - 팀장만 팀플 완료 가능
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteTeam}
            >
              <View style={styles.completeIcon}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
              </View>
              <Text style={styles.completeText}>팀플 완료</Text>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
      {/* 팀플 완료 확인 모달 */}
      <CompleteTeamModal
        visible={showCompleteModal}
        onClose={handleCancelComplete}
        onConfirm={handleConfirmComplete}
        teamName={title ? decodeURIComponent(String(title)) : 'No Team Name'}
      />

      {/* 팀플 완료 성공 모달 */}
      <TeamCompletionSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        teamName={title ? decodeURIComponent(String(title)) : 'No Team Name'}
      />

      {/* 방 떠나기 확인 모달 */}
      {showLeaveModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>티밍룸 나가기</Text>
            <Text style={styles.modalMessage}>
              정말로 이 티밍룸을 떠나시겠습니까?{'\n'}
              방을 떠나면 다시 들어올 수 없습니다.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleCancelLeave}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmLeave}
              >
                <Text style={styles.modalConfirmText}>나가기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 초대코드 모달 */}
      {showInviteModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.inviteModalContainer}>
            <Text style={styles.inviteModalTitle}>초대코드</Text>
            <Text style={styles.inviteModalSubtitle}>
              아래 초대코드를 복사하여 팀원들에게 공유하세요
            </Text>

            <View style={styles.inviteCodeContainer}>
              <Text style={styles.inviteCodeText}>{inviteCode}</Text>
            </View>

            <View style={styles.inviteModalButtons}>
              <TouchableOpacity
                style={styles.inviteModalCancelButton}
                onPress={handleCloseInviteModal}
              >
                <Text style={styles.inviteModalCancelText}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inviteModalCopyButton}
                onPress={handleCopyInviteCode}
              >
                <Text style={styles.inviteModalCopyText}>복사하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    flex: 1,
  },
  roomInfo: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  roomIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#121216',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    backgroundColor: '#121216',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292929',
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 15,
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  meBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#666666',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  meText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  leaveIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leaveText: {
    flex: 1,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  completeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  completeText: {
    flex: 1,
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#121216',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 24,
    marginHorizontal: 20,
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#292929',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emptyParticipants: {
    padding: 16,
    alignItems: 'center',
  },
  emptyParticipantsText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  // 초대코드 모달 스타일
  inviteModalContainer: {
    backgroundColor: '#121216',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 24,
    marginHorizontal: 20,
    minWidth: 300,
    alignItems: 'center',
  },
  inviteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  inviteModalSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  inviteCodeContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292929',
  },
  inviteCodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  inviteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  inviteModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#292929',
    alignItems: 'center',
  },
  inviteModalCancelText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inviteModalCopyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  inviteModalCopyText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
