import React, { useState } from 'react';
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
import CompleteTeamModal from './complete-team-modal';
import TeamCompletionSuccessModal from './team-completion-success-modal';
import * as apiService from '@/src/services/api';

const { width } = Dimensions.get('window');

interface Participant {
  id: number;
  name: string;
  avatar: any;
  isMe: boolean;
}

export default function ChatMenuScreen() {
  const { roomId, isLeader, isCompleted } = useLocalSearchParams();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // 팀장 여부 확인 (실제로는 API에서 가져올 데이터)
  const isTeamLeader = isLeader === 'true';
  // 팀플 완료 상태 확인
  const isTeamCompleted = isCompleted === 'true';

  // 참가자 목록 (실제로는 API에서 가져올 데이터)
  const participants: Participant[] = [
    {
      id: 1,
      name: '권민석',
      avatar: require('../../../assets/images/(chattingRoom)/me.png'),
      isMe: true,
    },
    {
      id: 2,
      name: '팀장 최순조',
      avatar: require('../../../assets/images/(chattingRoom)/choi.png'),
      isMe: false,
    },
    {
      id: 3,
      name: '정치학존잘남',
      avatar: require('../../../assets/images/(chattingRoom)/politicMan.png'),
      isMe: false,
    },
    {
      id: 4,
      name: '팀플하기싫다',
      avatar: require('../../../assets/images/(chattingRoom)/noTeample.png'),
      isMe: false,
    },
  ];

  const handleBackPress = () => {
    router.back();
  };

  const handleDataRoom = () => {
    router.push(`/(tabs)/chats/data-room/${roomId}`);
  };

  const handleCreateTask = () => {
    router.push(`/(tabs)/chats/create-task?roomId=${roomId}`);
  };

  const handleViewTasks = () => {
    // 과제 목록 화면으로 이동
    router.push(`/(tabs)/chats/task-list?roomId=${roomId}`);
  };

  const handleSubmitTasks = () => {
    // 과제 제출 화면으로 이동
    router.push(`/(tabs)/chats/submit-task?roomId=${roomId}`);
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
        <Text style={styles.headerTitle}>정치학 발표</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 자료실/과제 섹션 */}
        <View style={styles.section}>
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
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleViewTasks}
              >
                <View style={styles.menuIcon}>
                  <Ionicons name="document-text" size={24} color="#007AFF" />
                </View>
                <Text style={styles.menuText}>과제방</Text>
                <Ionicons name="chevron-forward" size={20} color="#666666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleSubmitTasks}
              >
                <View style={styles.menuIcon}>
                  <Ionicons name="send" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.menuText}>과제 제출</Text>
                <Ionicons name="chevron-forward" size={20} color="#666666" />
              </TouchableOpacity>
            </>
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
          {participants.map((participant) => (
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
          ))}
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
        teamName="정치학 발표"
      />

      {/* 팀플 완료 성공 모달 */}
      <TeamCompletionSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        teamName="정치학 발표"
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
});
