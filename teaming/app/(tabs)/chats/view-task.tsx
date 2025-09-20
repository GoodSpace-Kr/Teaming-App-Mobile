import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AssignedMember {
  id: number;
  name: string;
  avatar: any;
  hasSubmitted: boolean;
  submittedAt?: string;
  submissionText?: string;
  submittedFiles?: {
    id: string;
    name: string;
    size: number;
    type: string;
  }[];
}

interface TaskInfo {
  id: number;
  title: string;
  description: string;
  deadline: string;
  assignedMembers: AssignedMember[];
  status: 'pending' | 'submitted';
  createdBy: string;
  createdAt: string;
}

export default function ViewTaskScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  // 목데이터 - 실제 API 연동 시 대체
  const [tasks] = useState<TaskInfo[]>([
    {
      id: 1,
      title: '자료조사 2명 과제부여',
      description:
        '자료조사를 하겠다고 한 2명에게 과제를 부여합니다.\n제한시간에 맞춰서 과제 제출해주시면 감사하겠습니다.',
      deadline: '2025년 9월 7일 07:00',
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
          submissionText: '발표 자료를 준비했습니다. 주요 내용은...',
          submittedFiles: [
            {
              id: '1',
              name: '발표자료.pptx',
              size: 5120000,
              type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            },
          ],
        },
      ],
      status: 'pending',
      createdBy: '최순조(팀장)',
      createdAt: '2025년 9월 7일 09:15',
    },
  ]);

  // URL 파라미터로 받은 ID에 해당하는 과제 찾기
  const taskInfo =
    tasks.find((task) => task.id === parseInt(id || '1')) || tasks[0];

  const handleBackPress = () => {
    router.back();
  };

  const handleSubmitTask = () => {
    // 과제 제출 화면으로 이동
    router.push('/(tabs)/chats/submit-task');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return '#4CAF50';
      case 'pending':
        return '#FF9500';
      default:
        return '#666666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return '제출완료';
      case 'pending':
        return '미제출';
      default:
        return '알 수 없음';
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
        <Text style={styles.headerTitle}>과제 확인</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 과제 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>과제 정보</Text>
          <View style={styles.taskInfoCard}>
            <Text style={styles.taskTitle}>{taskInfo.title}</Text>
            <Text style={styles.taskDescription}>{taskInfo.description}</Text>
            <View style={styles.taskMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar" size={16} color="#007AFF" />
                <Text style={styles.metaText}>마감: {taskInfo.deadline}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people" size={16} color="#007AFF" />
                <Text style={styles.metaText}>
                  담당자:{' '}
                  {taskInfo.assignedMembers.map((m) => m.name).join(', ')}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons
                  name="time"
                  size={16}
                  color={getStatusColor(taskInfo.status)}
                />
                <Text
                  style={[
                    styles.metaText,
                    { color: getStatusColor(taskInfo.status) },
                  ]}
                >
                  상태: {getStatusText(taskInfo.status)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="person" size={16} color="#666666" />
                <Text style={styles.metaText}>
                  생성자: {taskInfo.createdBy}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#666666" />
                <Text style={styles.metaText}>
                  생성일: {taskInfo.createdAt}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 제출 현황 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제출 현황</Text>
          <View style={styles.submissionsContainer}>
            {taskInfo.assignedMembers.map((member) => {
              const status = getSubmissionStatus(member);
              return (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <View style={styles.statusContainer}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: status.color },
                          ]}
                        />
                        <Text
                          style={[styles.statusText, { color: status.color }]}
                        >
                          {status.text}
                        </Text>
                        {member.hasSubmitted && member.submittedAt && (
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
                          <Text style={styles.submissionTextLabel}>
                            제출 내용:
                          </Text>
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
    marginRight: 0,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  taskInfoCard: {
    backgroundColor: '#121216',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#292929',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 16,
  },
  taskMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  submitInfoCard: {
    backgroundColor: '#121216',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#292929',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  submitInfoText: {
    flex: 1,
  },
  submitInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  submitInfoDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 34,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submissionsContainer: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: '#121216',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#292929',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusContainer: {
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
    fontSize: 14,
    fontWeight: '500',
  },
  submittedAt: {
    fontSize: 12,
    color: '#888888',
  },
  submissionDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#292929',
  },
  submissionTextContainer: {
    marginBottom: 12,
  },
  submissionTextLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  submissionText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  submittedFilesContainer: {
    gap: 8,
  },
  submittedFilesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
  fileSize: {
    fontSize: 12,
    color: '#888888',
  },
});
