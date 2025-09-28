import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getChatRooms, ChatRoom } from '../../../src/services/chatService';
import { TaskService } from '../../../src/services/taskService';
import { AssignmentSummary } from '../../../src/types/task';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [teams, setTeams] = useState<ChatRoom[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(true);

  // 팀 목록 가져오기
  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const chatRooms = await getChatRooms();
      setTeams(chatRooms);
      console.log('✅ 홈 화면 팀 목록 로드 완료:', chatRooms);
    } catch (error) {
      console.error('❌ 팀 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 과제 목록 가져오기
  const loadAssignments = async () => {
    try {
      setIsAssignmentsLoading(true);
      const assignmentSummaries = await TaskService.getAssignmentSummaries();
      setAssignments(assignmentSummaries);
      console.log('✅ 홈 화면 과제 목록 로드 완료:', assignmentSummaries);
    } catch (error) {
      console.error('❌ 과제 목록 로드 실패:', error);
    } finally {
      setIsAssignmentsLoading(false);
    }
  };

  // 홈 탭이 포커스될 때마다 팀 목록과 과제 목록 새로고침
  useFocusEffect(
    useCallback(() => {
      console.log('홈 화면 포커스 - 팀 목록 및 과제 목록 새로고침');
      loadTeams();
      loadAssignments();
    }, [])
  );

  // 과제 상태에 따른 색상 매핑
  const getAssignmentColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return '#4A90E2';
      case 'COMPLETED':
        return '#10B981';
      case 'CANCELLED':
        return '#FF3B30';
      default:
        return '#8B5CF6';
    }
  };

  // 과제 상태에 따른 텍스트 매핑
  const getAssignmentStatusText = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return '진행중';
      case 'COMPLETED':
        return '완료';
      case 'CANCELLED':
        return '취소됨';
      default:
        return '알 수 없음';
    }
  };

  // 날짜 포맷팅 함수
  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `마감됨 (${date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      })})`;
    } else if (diffDays === 0) {
      return `오늘 마감 (${date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })})`;
    } else if (diffDays === 1) {
      return `내일 마감 (${date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      })})`;
    } else {
      return `${diffDays}일 남음 (${date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      })})`;
    }
  };

  const handleCreateTeam = () => {
    router.push('/(tabs)/home/create-team');
  };

  const handleJoinTeam = () => {
    router.push('/(tabs)/home/join-team');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.logoAndTitle}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logo}
            />
            <Text style={styles.appTitle}>Teaming</Text>
          </View>
          <View style={styles.sloganContainer}>
            <Text style={styles.slogan}>우리 팀플,</Text>
            <Text style={styles.slogan}>더 빠르게 더 스마트하게</Text>
          </View>
        </View>

        {/* 버튼들 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.createTeamButton}
            onPress={handleCreateTeam}
          >
            <Ionicons
              name="add"
              size={18}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>팀 만들기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.joinTeamButton}
            onPress={handleJoinTeam}
          >
            <Ionicons
              name="keypad"
              size={18}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>초대코드 입력</Text>
          </TouchableOpacity>
        </View>

        {/* 내 팀 한눈에 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>내 팀 한눈에</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>팀 목록을 불러오는 중...</Text>
            </View>
          ) : teams.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>참여 중인 팀이 없습니다.</Text>
              <Text style={styles.emptySubtext}>
                팀을 만들거나 초대코드를 입력해보세요!
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.teamScrollContainer}
            >
              {teams.map((team) => (
                <View key={team.roomId} style={styles.teamCard}>
                  {/* 역할 표시 - 우측 상단 */}
                  <View style={styles.roleContainer}>
                    <Text
                      style={[
                        styles.teamRole,
                        {
                          color: team.role === 'LEADER' ? '#FFD700' : '#4A90E2',
                        },
                      ]}
                    >
                      {team.role === 'LEADER' ? '팀장' : '팀원'}
                    </Text>
                  </View>

                  <View style={styles.teamCardHeader}>
                    {/* 팀 이미지 또는 기본 아이콘 */}
                    {team.avatarUrl ? (
                      <Image
                        source={{ uri: team.avatarUrl }}
                        style={styles.teamIcon}
                        onError={() => {
                          console.log('팀 아바타 이미지 로드 실패');
                        }}
                      />
                    ) : (
                      <View style={styles.defaultTeamIcon}>
                        <Ionicons name="people" size={20} color="#007AFF" />
                      </View>
                    )}

                    <View style={styles.teamInfo}>
                      <Text style={styles.teamTitle}>{team.title}</Text>
                      <Text style={styles.teamSubtitle}>
                        {team.type.typeName} • {team.memberCount}명
                      </Text>
                    </View>
                  </View>

                  {/* 팀플 완료 상태 표시 - 좌측 하단 */}
                  <View style={styles.completionStatusContainer}>
                    <View
                      style={[
                        styles.completionStatusBadge,
                        {
                          backgroundColor: team.success ? '#4CAF50' : '#FF9800',
                        },
                      ]}
                    >
                      <Ionicons
                        name={team.success ? 'checkmark-circle' : 'time'}
                        size={12}
                        color="#FFFFFF"
                      />
                      <Text style={styles.completionStatusText}>
                        {team.success ? '완료' : '진행중'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 일정 한눈에 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>일정 한눈에</Text>
          {isAssignmentsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>과제 목록을 불러오는 중...</Text>
            </View>
          ) : assignments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>진행 중인 과제가 없습니다.</Text>
              <Text style={styles.emptySubtext}>
                팀장이 과제를 만들면 여기에 표시됩니다!
              </Text>
            </View>
          ) : (
            <View style={styles.scheduleContainer}>
              {assignments.map((assignment) => (
                <View key={assignment.assignmentId} style={styles.scheduleItem}>
                  <View
                    style={[
                      styles.scheduleDot,
                      {
                        backgroundColor: getAssignmentColor(assignment.status),
                      },
                    ]}
                  />
                  <View style={styles.scheduleContent}>
                    <Text style={styles.scheduleText}>{assignment.title}</Text>
                    <Text style={styles.scheduleSubtext}>
                      {formatDueDate(assignment.due)} •{' '}
                      {getAssignmentStatusText(assignment.status)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 30,
  },
  logoAndTitle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 50, // 로고 높이와 맞춤
  },
  sloganContainer: {
    marginTop: 10,
    marginLeft: 0, // 로고(40px) + marginRight(12px) = 52px
  },
  slogan: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  createTeamButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flex: 1,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  joinTeamButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flex: 1,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6096FF',
    marginBottom: 16,
  },
  teamScrollContainer: {
    paddingRight: 20,
  },
  teamCard: {
    backgroundColor: '#121216',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 16,
    marginRight: 12,
    width: width * 0.7,
    minHeight: 120,
    position: 'relative',
  },
  teamCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  teamIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  teamSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  teamTime: {
    fontSize: 10,
    color: '#CCCCCC',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textAlign: 'center',
    minWidth: 60,
  },
  scheduleContainer: {
    gap: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121216',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 16,
  },
  scheduleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  scheduleText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 20,
    fontWeight: '600',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleSubtext: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 4,
    lineHeight: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#CCCCCC',
    marginLeft: 8,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#CCCCCC',
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#888888',
    fontSize: 14,
  },
  defaultTeamIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  teamRole: {
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  completionStatusContainer: {
    position: 'absolute',
    bottom: 19,
    left: 20,
    zIndex: 1,
  },
  completionStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completionStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
