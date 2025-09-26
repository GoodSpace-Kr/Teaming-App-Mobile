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
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TaskService } from '@/src/services/taskService';
import { TaskWithMembers, TaskMember } from '@/src/types/task';
import { getAccessToken } from '@/src/services/tokenManager';

const { width } = Dimensions.get('window');

// TaskWithMembers 타입을 사용하므로 별도 인터페이스 제거

// TaskMember 타입을 사용하므로 별도 인터페이스 제거

export default function TaskSubmissionsScreen() {
  const { roomId } = useLocalSearchParams<{ roomId?: string }>();
  const [tasks, setTasks] = useState<TaskWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // 멤버 정보 매핑 (실제로는 API에서 가져와야 함)
  const memberMap = new Map<number, TaskMember>([
    [1, { id: 1, name: '권민석', hasSubmitted: false }],
    [2, { id: 2, name: '정치학존잘남', hasSubmitted: false }],
    [3, { id: 3, name: '팀플하기싫다', hasSubmitted: false }],
    [4, { id: 4, name: '최순조(팀장)', hasSubmitted: false }],
  ]);

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

  // 현재 사용자 정보 로드
  React.useEffect(() => {
    loadCurrentUserInfo();
  }, []);

  // 과제 목록 로드 (화면 포커스 시마다 새로고침)
  useFocusEffect(
    React.useCallback(() => {
      if (currentUserId !== null && roomId) {
        loadTasks();
      }
    }, [currentUserId, roomId])
  );

  const loadCurrentUserInfo = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        const userId = getUserIdFromToken(token);
        setCurrentUserId(userId);
        console.log('👤 현재 사용자 ID:', userId);
      } else {
        console.error('❌ JWT 토큰을 찾을 수 없습니다');
        setCurrentUserId(1);
      }
    } catch (error) {
      console.error('❌ 현재 사용자 정보 로드 실패:', error);
      setCurrentUserId(1);
    }
  };

  const loadTasks = async () => {
    if (!roomId) return;

    try {
      setIsLoading(true);
      console.log('🚀 과제 목록 로드:', { roomId });

      const tasks = await TaskService.getTasks(Number(roomId));
      const transformedTasks = tasks.map((task) =>
        TaskService.transformTaskForUI(task, memberMap)
      );

      setTasks(transformedTasks);
      console.log('✅ 과제 목록 로드 성공:', transformedTasks.length, '개');
    } catch (error: any) {
      console.error('❌ 과제 목록 로드 실패:', error);
      Alert.alert('로드 실패', '과제 목록을 불러오는 중 오류가 발생했습니다.');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleCreateTask = () => {
    router.push('/(tabs)/chats/create-task');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSubmissionStatus = (member: TaskMember) => {
    if (member.hasSubmitted) {
      return { text: '제출완료', color: '#4CAF50' };
    } else {
      return { text: '미제출', color: '#FF3B30' };
    }
  };

  const renderTask = (task: TaskWithMembers) => (
    <View key={task.assignmentId} style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskDeadline}>
          마감: {TaskService.formatDateFromISO(task.due)}
        </Text>
      </View>

      <Text style={styles.taskDescription}>{task.description}</Text>

      <View style={styles.taskMeta}>
        <Text style={styles.taskCreatedAt}>
          생성일: {TaskService.formatDateFromISO(task.createdAt)}
        </Text>
      </View>

      <View style={styles.submissionsSection}>
        <Text style={styles.submissionsTitle}>제출 현황</Text>
        {task.assignedMembers.map((member) => {
          const status = getSubmissionStatus(member);
          return (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
                </View>
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: status.color },
                      ]}
                    />
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {status.text}
                    </Text>
                    {member.hasSubmitted && member.submittedAt && (
                      <Text style={styles.submittedAt}>
                        ({TaskService.formatDateFromISO(member.submittedAt)})
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {member.hasSubmitted && (
                <View style={styles.submissionDetails}>
                  <View style={styles.submissionTextContainer}>
                    <Text style={styles.submissionTextLabel}>제출 내용:</Text>
                    <Text style={styles.submissionText}>
                      과제가 제출되었습니다.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>과제 제출 확인</Text>
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
            <TouchableOpacity
              style={styles.createTaskButton}
              onPress={handleCreateTask}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createTaskButtonText}>과제 생성하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tasksContainer}>{tasks.map(renderTask)}</View>
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
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  createTaskButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tasksContainer: {
    paddingBottom: 20,
  },
  taskCard: {
    backgroundColor: '#121216',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#292929',
  },
  taskHeader: {
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  taskDeadline: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskMeta: {
    marginBottom: 16,
  },
  taskCreatedAt: {
    fontSize: 12,
    color: '#888888',
  },
  submissionsSection: {
    borderTopWidth: 1,
    borderTopColor: '#292929',
    paddingTop: 16,
  },
  submissionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  memberCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submittedAt: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 8,
  },
  submissionDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  submissionTextContainer: {
    marginBottom: 12,
  },
  submissionTextLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCCCCC',
    marginBottom: 4,
  },
  submissionText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  submittedFilesContainer: {
    marginTop: 8,
  },
  submittedFilesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCCCCC',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  fileSize: {
    fontSize: 12,
    color: '#888888',
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
