import React, { useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LeaveTeamModal from './leave-team-modal';
import CompleteTeamModal from './complete-team-modal';

const { width } = Dimensions.get('window');

interface Participant {
  id: number;
  name: string;
  avatar: any;
  isMe: boolean;
}

export default function ChatMenuScreen() {
  const { roomId, isLeader } = useLocalSearchParams();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // 팀장 여부 확인 (실제로는 API에서 가져올 데이터)
  const isTeamLeader = isLeader === 'true';

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
    router.push('/(tabs)/chats/create-task');
  };

  const handleViewTasks = () => {
    // 과제 확인/제출 화면으로 이동
    router.push('/(tabs)/chats/submit-task');
  };

  const handleViewTaskSubmissions = () => {
    // 과제 제출 확인 화면으로 이동
    router.push('/(tabs)/chats/task-submissions');
  };

  const handleLeaveRoom = () => {
    // 팀밍룸 나가기 모달 표시
    setShowLeaveModal(true);
  };

  const handleConfirmLeave = () => {
    // 모달 닫기
    setShowLeaveModal(false);
    // 홈 화면으로 이동
    router.push('/(tabs)/home');
  };

  const handleCancelLeave = () => {
    // 모달 닫기
    setShowLeaveModal(false);
  };

  const handleCompleteTeam = () => {
    // 팀플 완료 모달 표시
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = () => {
    // 팀플 완료 처리
    console.log('팀플 완료 처리');
    setShowCompleteModal(false);
    // 완료 후 홈 화면으로 이동하거나 다른 처리
    router.push('/(tabs)/home');
  };

  const handleCancelComplete = () => {
    // 모달 닫기
    setShowCompleteModal(false);
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

          <TouchableOpacity
            style={styles.menuItem}
            onPress={isTeamLeader ? handleCreateTask : handleViewTasks}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="document-text" size={24} color="#007AFF" />
            </View>
            <Text style={styles.menuText}>
              {isTeamLeader ? '과제 생성하기' : '과제 확인/제출'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          {isTeamLeader && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleViewTaskSubmissions}
            >
              <View style={styles.menuIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.menuText}>과제 제출 확인</Text>
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

        {/* 팀플 완료 (팀장만) */}
        {isTeamLeader && (
          <View style={styles.section}>
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
          </View>
        )}

        {/* 팀밍룸 나가기 */}
        <View style={styles.section}>
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
        </View>
      </ScrollView>

      {/* 티밍룸 나가기 모달 */}
      <LeaveTeamModal
        visible={showLeaveModal}
        onClose={handleCancelLeave}
        onConfirm={handleConfirmLeave}
        teamName="정치학 발표"
      />

      {/* 팀플 완료 모달 */}
      <CompleteTeamModal
        visible={showCompleteModal}
        onClose={handleCancelComplete}
        onConfirm={handleConfirmComplete}
        teamName="정치학 발표"
      />
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
});
