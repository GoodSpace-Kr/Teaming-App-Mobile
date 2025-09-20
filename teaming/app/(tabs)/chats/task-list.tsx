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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AssignedMember {
  id: number;
  name: string;
  avatar: any;
  hasSubmitted: boolean;
  submittedAt?: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  deadline: string;
  assignedMembers: AssignedMember[];
  status: 'pending' | 'submitted';
  createdBy: string;
  createdAt: string;
}

export default function TaskListScreen() {
  // 목데이터 - 실제 API 연동 시 대체
  const [tasks] = useState<Task[]>([
    {
      id: 1,
      title: '자료조사 2명 과제부여',
      description: '자료조사를 하겠다고 한 2명에게 과제를 부여합니다.',
      deadline: '2025년 9월 7일 07:00',
      assignedMembers: [
        {
          id: 1,
          name: '권민석',
          avatar: require('../../../assets/images/(chattingRoom)/me.png'),
          hasSubmitted: true,
          submittedAt: '2025년 09월 06일 16:45',
        },
        {
          id: 2,
          name: '정치학존잘남',
          avatar: require('../../../assets/images/(chattingRoom)/politicMan.png'),
          hasSubmitted: false,
        },
      ],
      status: 'pending',
      createdBy: '최순조(팀장)',
      createdAt: '2025년 9월 6일 15:30',
    },
    {
      id: 2,
      title: '발표 자료 준비',
      description: '다음 주 발표를 위한 PPT 자료를 준비해주세요.',
      deadline: '2025년 9월 10일 18:00',
      assignedMembers: [
        {
          id: 1,
          name: '권민석',
          avatar: require('../../../assets/images/(chattingRoom)/me.png'),
          hasSubmitted: false,
        },
        {
          id: 3,
          name: '팀플하기싫다',
          avatar: require('../../../assets/images/(chattingRoom)/noTeample.png'),
          hasSubmitted: true,
          submittedAt: '2025년 09월 08일 14:20',
        },
      ],
      status: 'pending',
      createdBy: '최순조(팀장)',
      createdAt: '2025년 9월 7일 09:15',
    },
    {
      id: 3,
      title: '최종 보고서 작성',
      description: '프로젝트 최종 보고서를 작성해주세요.',
      deadline: '2025년 9월 15일 23:59',
      assignedMembers: [
        {
          id: 1,
          name: '권민석',
          avatar: require('../../../assets/images/(chattingRoom)/me.png'),
          hasSubmitted: true,
          submittedAt: '2025년 09월 14일 20:30',
        },
        {
          id: 2,
          name: '정치학존잘남',
          avatar: require('../../../assets/images/(chattingRoom)/politicMan.png'),
          hasSubmitted: true,
          submittedAt: '2025년 09월 15일 15:45',
        },
        {
          id: 3,
          name: '팀플하기싫다',
          avatar: require('../../../assets/images/(chattingRoom)/noTeample.png'),
          hasSubmitted: true,
          submittedAt: '2025년 09월 15일 18:20',
        },
      ],
      status: 'submitted',
      createdBy: '최순조(팀장)',
      createdAt: '2025년 9월 10일 11:00',
    },
  ]);

  const handleBackPress = () => {
    router.back();
  };

  const handleTaskPress = (taskId: number) => {
    router.push(`/(tabs)/chats/view-task?id=${taskId}`);
  };

  const getTaskStatus = (task: Task) => {
    const totalMembers = task.assignedMembers.length;
    const submittedMembers = task.assignedMembers.filter(
      (m) => m.hasSubmitted
    ).length;

    if (submittedMembers === 0) {
      return { text: '미시작', color: '#FF3B30', progress: 0 };
    } else if (submittedMembers === totalMembers) {
      return { text: '완료', color: '#4CAF50', progress: 100 };
    } else {
      return {
        text: `${submittedMembers}/${totalMembers} 제출`,
        color: '#FF9500',
        progress: (submittedMembers / totalMembers) * 100,
      };
    }
  };

  const formatDate = (dateString: string) => {
    // 간단한 날짜 포맷팅 (실제로는 더 정교한 로직 필요)
    return dateString.split(' ')[0]; // "2025년 9월 7일" 부분만 추출
  };

  const renderTaskItem = (task: Task) => {
    const status = getTaskStatus(task);

    return (
      <TouchableOpacity
        key={task.id}
        style={styles.taskItem}
        onPress={() => handleTaskPress(task.id)}
      >
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle} numberOfLines={1}>
            {task.title}
          </Text>
          <View style={styles.taskStatus}>
            <View
              style={[styles.statusDot, { backgroundColor: status.color }]}
            />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>
        </View>

        <Text style={styles.taskDescription} numberOfLines={2}>
          {task.description}
        </Text>

        <View style={styles.taskMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar" size={14} color="#666666" />
            <Text style={styles.metaText}>
              마감: {formatDate(task.deadline)}
            </Text>
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

        {/* 팀원 아바타 */}
        <View style={styles.membersContainer}>
          <Text style={styles.membersLabel}>담당자:</Text>
          <View style={styles.avatarsContainer}>
            {task.assignedMembers.slice(0, 3).map((member) => (
              <View key={member.id} style={styles.avatarContainer}>
                <Image source={member.avatar} style={styles.memberAvatar} />
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
        {tasks.length === 0 ? (
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
});
