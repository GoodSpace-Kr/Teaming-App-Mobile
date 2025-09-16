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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Task {
  id: number;
  title: string;
  description: string;
  deadline: string;
  assignedMembers: AssignedMember[];
  createdAt: string;
}

interface AssignedMember {
  id: number;
  name: string;
  avatar: any;
  hasSubmitted: boolean;
  submittedAt?: string;
  submissionText?: string;
  submittedFiles?: SubmittedFile[];
}

interface SubmittedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export default function TaskSubmissionsScreen() {
  // 목데이터 - 실제 API 연동 시 대체
  const [tasks] = useState<Task[]>([
    {
      id: 1,
      title: '자료조사 2명 과제부여',
      description:
        '자료조사를 하겠다고 한 2명에게 과제를 부여합니다.\n제한시간에 맞춰서 과제 제출해주시면 감사하겠습니다.',
      deadline: '2025년 09월 07일 07:00',
      createdAt: '2025년 09월 05일 14:30',
      assignedMembers: [
        {
          id: 1,
          name: '권민석',
          avatar: require('../../../assets/images/(chattingRoom)/me.png'),
          hasSubmitted: true,
          submittedAt: '2025년 09월 06일 16:45',
          submissionText:
            '정치학 관련 자료를 수집했습니다. 주요 내용은 다음과 같습니다...',
          submittedFiles: [
            {
              id: '1',
              name: '정치학_자료조사.pdf',
              size: 2048576,
              type: 'application/pdf',
            },
            {
              id: '2',
              name: '참고문헌.docx',
              size: 1024000,
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
          ],
        },
        {
          id: 2,
          name: '정치학존잘남',
          avatar: require('../../../assets/images/(chattingRoom)/politicMan.png'),
          hasSubmitted: false,
        },
      ],
    },
  ]);

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

  const getSubmissionStatus = (member: AssignedMember) => {
    if (member.hasSubmitted) {
      return { text: '제출완료', color: '#4CAF50' };
    } else {
      return { text: '미제출', color: '#FF3B30' };
    }
  };

  const renderTask = (task: Task) => (
    <View key={task.id} style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskDeadline}>마감: {task.deadline}</Text>
      </View>

      <Text style={styles.taskDescription}>{task.description}</Text>

      <View style={styles.taskMeta}>
        <Text style={styles.taskCreatedAt}>생성일: {task.createdAt}</Text>
      </View>

      <View style={styles.submissionsSection}>
        <Text style={styles.submissionsTitle}>제출 현황</Text>
        {task.assignedMembers.map((member) => {
          const status = getSubmissionStatus(member);
          return (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Image source={member.avatar} style={styles.memberAvatar} />
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
                    {member.submittedAt && (
                      <Text style={styles.submittedAt}>
                        ({member.submittedAt})
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {member.hasSubmitted && (
                <View style={styles.submissionDetails}>
                  {member.submissionText && (
                    <View style={styles.submissionTextContainer}>
                      <Text style={styles.submissionTextLabel}>제출 내용:</Text>
                      <Text style={styles.submissionText}>
                        {member.submissionText}
                      </Text>
                    </View>
                  )}

                  {member.submittedFiles &&
                    member.submittedFiles.length > 0 && (
                      <View style={styles.submittedFilesContainer}>
                        <Text style={styles.submittedFilesLabel}>
                          첨부 파일:
                        </Text>
                        {member.submittedFiles.map((file) => (
                          <View key={file.id} style={styles.fileItem}>
                            <Ionicons
                              name="document"
                              size={16}
                              color="#CCCCCC"
                            />
                            <Text style={styles.fileName}>{file.name}</Text>
                            <Text style={styles.fileSize}>
                              ({formatFileSize(file.size)})
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
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
        {tasks.length === 0 ? (
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
});

