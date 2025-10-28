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
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TaskService } from '@/src/services/taskService';
import { Task, TaskWithMembers, TaskMember } from '@/src/types/task';
import { getUserInfo } from '@/src/services/api';
import { getAccessToken } from '@/src/services/tokenManager';

const { width } = Dimensions.get('window');

export default function TaskListScreen() {
  const { roomId, isLeader, members } = useLocalSearchParams<{
    roomId: string;
    isLeader?: string;
    members?: string;
  }>();
  const [tasks, setTasks] = useState<TaskWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [roomMembers, setRoomMembers] = useState<any[]>([]);
  const isTeamLeader = isLeader === 'true';

  // members 정보 파싱
  useEffect(() => {
    if (members) {
      try {
        const membersData = JSON.parse(decodeURIComponent(members));
        setRoomMembers(membersData);
        console.log('📋 과제 목록 - 파싱된 members 데이터:', membersData);
      } catch (error) {
        console.error('❌ members 파싱 실패:', error);
        setRoomMembers([]);
      }
    }
  }, [members]);

  // 현재 사용자 정보 로드
  useEffect(() => {
    loadCurrentUserInfo();
  }, []);

  // 과제 목록 로드 (화면 포커스 시마다 새로고침, roomMembers 설정 후)
  useFocusEffect(
    React.useCallback(() => {
      if (currentUserId !== null && (roomMembers.length > 0 || !members)) {
        loadTasks();
      }
    }, [currentUserId, roomMembers.length])
  );

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

  const loadCurrentUserInfo = async () => {
    try {
      // JWT 토큰에서 사용자 ID 추출
      const token = await getAccessToken();
      if (token) {
        const userId = getUserIdFromToken(token);
        setCurrentUserId(userId);
        console.log('👤 현재 사용자 ID:', userId);
      } else {
        console.error('❌ JWT 토큰을 찾을 수 없습니다');
        // 기본값으로 1 설정 (권민석)
        setCurrentUserId(1);
      }
    } catch (error) {
      console.error('❌ 현재 사용자 정보 로드 실패:', error);
      // 기본값으로 1 설정 (권민석)
      setCurrentUserId(1);
    }
  };

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 과제 목록 로드:', { roomId });

      // 토큰 상태 확인
      const token = await getAccessToken();
      console.log('🔑 현재 토큰 상태:', token ? '토큰 있음' : '토큰 없음');
      if (token) {
        console.log('🔑 토큰 길이:', token.length);
        console.log('🔑 토큰 앞 20자:', token.substring(0, 20) + '...');
      }

      const tasks = await TaskService.getTasks(Number(roomId));

      // 실제 roomMembers 정보를 TaskMember 형식으로 변환
      const memberMap = new Map<number, TaskMember>();
      roomMembers.forEach((member) => {
        const name =
          member.roomRole === 'LEADER' ? `${member.name}(팀장)` : member.name;
        memberMap.set(member.memberId, {
          id: member.memberId,
          name: name,
          hasSubmitted: false,
        });
      });

      // 백엔드 Task를 UI용 TaskWithMembers로 변환
      const transformedTasks = tasks.map((task) =>
        TaskService.transformTaskForUI(task, memberMap)
      );

      setTasks(transformedTasks);

      console.log('✅ 과제 목록 로드 성공:', transformedTasks.length, '개');
    } catch (error: any) {
      console.error('❌ 과제 목록 로드 실패:', error);
      Alert.alert('로드 실패', '과제 목록을 불러오는 중 오류가 발생했습니다.');
      // API 실패 시 목데이터 사용
      useMockData();
    } finally {
      setIsLoading(false);
    }
  };

  // API 실패 시 목데이터 사용
  const useMockData = () => {
    const mockTask: Task = {
      assignmentId: 1,
      title: '자료조사 2명 과제부여',
      description: '자료조사를 하겠다고 한 2명에게 과제를 부여합니다.',
      assignedMemberIds: [1, 2],
      due: '2025-09-07T07:00:00.000Z',
      status: 'IN_PROGRESS',
      submissions: [
        {
          submitterId: 1,
          description: '자료조사 완료했습니다.',
          createdAt: '2025-09-06T16:45:00.000Z',
          updatedAt: '2025-09-06T16:45:00.000Z',
          files: [],
        },
      ],
    };

    // 실제 roomMembers 정보를 TaskMember 형식으로 변환
    const mockMemberMap = new Map<number, TaskMember>();
    roomMembers.forEach((member) => {
      const name =
        member.roomRole === 'LEADER' ? `${member.name}(팀장)` : member.name;
      mockMemberMap.set(member.memberId, {
        id: member.memberId,
        name: name,
        hasSubmitted: false,
      });
    });

    const transformedTask = TaskService.transformTaskForUI(
      mockTask,
      mockMemberMap
    );
    setTasks([transformedTask]);
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleTaskPress = (taskId: number) => {
    // 모든 과제는 과제 확인 뷰로 이동 (제출 기능 포함)
    const membersParam = members
      ? `&members=${encodeURIComponent(members as string)}`
      : '';
    router.push(
      `/(tabs)/chats/view-task?id=${taskId}&roomId=${roomId}${membersParam}`
    );
  };

  const handleDeleteTask = async (task: TaskWithMembers) => {
    Alert.alert(
      '과제 삭제',
      `"${task.title}" 과제를 삭제하시겠습니까?\n\n삭제된 과제는 복구할 수 없습니다.`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ 과제 삭제:', task.assignmentId, task.title);
              await TaskService.deleteTask(Number(roomId), task.assignmentId);

              // 목록에서 제거
              setTasks((prev) =>
                prev.filter((t) => t.assignmentId !== task.assignmentId)
              );

              Alert.alert('삭제 완료', '과제가 삭제되었습니다.');
            } catch (error: any) {
              console.error('❌ 과제 삭제 실패:', error);
              Alert.alert(
                '삭제 실패',
                `과제 삭제 중 오류가 발생했습니다.\n${
                  error.message || '알 수 없는 오류'
                }`
              );
            }
          },
        },
      ]
    );
  };

  const getTaskStatus = (task: TaskWithMembers) => {
    return TaskService.getTaskStatus(task);
  };

  const formatDate = (dateString: string) => {
    // ISO 8601 형식의 날짜를 사용자 친화적 형식으로 변환
    return TaskService.formatDateFromISO(dateString);
  };

  // 본인이 할당된 과제인지 확인
  const isAssignedToMe = (task: TaskWithMembers) => {
    if (!currentUserId) return false;
    return task.assignedMemberIds.includes(currentUserId);
  };

  // 본인의 제출 상태 확인
  const getMySubmissionStatus = (task: TaskWithMembers) => {
    if (!currentUserId) return null;
    const myMember = task.assignedMembers.find(
      (member) => member.id === currentUserId
    );
    return myMember ? myMember.hasSubmitted : false;
  };

  const renderTaskItem = (task: TaskWithMembers) => {
    const status = getTaskStatus(task);
    const isMyTask = isAssignedToMe(task);
    const mySubmissionStatus = getMySubmissionStatus(task);

    return (
      <TouchableOpacity
        key={task.assignmentId}
        style={styles.taskItem}
        onPress={() => handleTaskPress(task.assignmentId)}
      >
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle} numberOfLines={1}>
            {task.title}
          </Text>
          <View style={styles.taskHeaderRight}>
            {/* 본인에게 할당된 과제의 제출 상태 표시 */}
            {isMyTask && (
              <View
                style={[
                  styles.submissionStatusBadge,
                  {
                    backgroundColor: mySubmissionStatus ? '#4CAF50' : '#FF9500',
                  },
                ]}
              >
                <Text style={styles.submissionStatusText}>
                  {mySubmissionStatus ? '제출 완료' : '제출 필요'}
                </Text>
              </View>
            )}
            {/* 팀장만 삭제 버튼 표시 */}
            {isTeamLeader && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteTask(task)}
              >
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.taskDescription} numberOfLines={2}>
          {task.description}
        </Text>

        <View style={styles.taskMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar" size={14} color="#666666" />
            <Text style={styles.metaText}>마감: {formatDate(task.due)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="person" size={14} color="#666666" />
            <Text style={styles.metaText}>{task.createdBy}</Text>
          </View>
        </View>

        {/* 진행률 바 */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${status.progress}%`, backgroundColor: status.color },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{status.progress}%</Text>
        </View>

        {/* 팀원 아바타와 제출 현황 */}
        <View style={styles.membersContainer}>
          <View style={styles.membersLeft}>
            <Text style={styles.membersLabel}>담당자:</Text>
            <View style={styles.avatarsContainer}>
              {task.assignedMembers.slice(0, 3).map((member) => (
                <View key={member.id} style={styles.avatarContainer}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.avatarText}>
                      {member.name.charAt(0)}
                    </Text>
                  </View>
                  {member.hasSubmitted && (
                    <View style={styles.submittedBadge}>
                      <Ionicons name="checkmark" size={8} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              ))}
              {task.assignedMembers.length > 3 && (
                <View style={styles.moreMembers}>
                  <Text style={styles.moreMembersText}>
                    +{task.assignedMembers.length - 3}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 제출 현황을 우측 하단으로 이동 */}
          <View style={styles.taskStatus}>
            <View
              style={[styles.statusDot, { backgroundColor: status.color }]}
            />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>과제 목록</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>과제 목록을 불러오는 중...</Text>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#666666" />
            <Text style={styles.emptyTitle}>생성된 과제가 없습니다</Text>
            <Text style={styles.emptyDescription}>
              아직 생성된 과제가 없습니다.{'\n'}
              과제를 생성하여 팀원들에게 할당해보세요.
            </Text>
          </View>
        ) : (
          <View style={styles.tasksContainer}>{tasks.map(renderTaskItem)}</View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginRight: 0, // 뒤로가기 버튼과 균형 맞추기
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tasksContainer: {
    gap: 16,
  },
  taskItem: {
    backgroundColor: '#121216',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#292929',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  taskHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submissionStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FF9500',
  },
  submissionStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  taskStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666666',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#292929',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  membersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  membersLabel: {
    fontSize: 12,
    color: '#666666',
  },
  avatarsContainer: {
    flexDirection: 'row',
    gap: -8,
  },
  avatarContainer: {
    position: 'relative',
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#121216',
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  submittedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreMembers: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#121216',
  },
  moreMembersText: {
    fontSize: 10,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
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
});
