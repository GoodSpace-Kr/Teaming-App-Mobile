import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TaskService } from '@/src/services/taskService';
import { Task, TaskWithMembers, TaskMember } from '@/src/types/task';
import { getAccessToken } from '@/src/services/tokenManager';
import { FileService } from '@/src/services/fileService';
import * as DocumentPicker from 'expo-document-picker';

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
  const { id, roomId, members } = useLocalSearchParams<{
    id?: string;
    roomId?: string;
    members?: string;
  }>();
  const [taskInfo, setTaskInfo] = useState<TaskWithMembers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<
    DocumentPicker.DocumentPickerResult[]
  >([]);
  const [mySubmissionData, setMySubmissionData] = useState<{
    content: string;
    submittedAt: string;
  } | null>(null);
  const [roomMembers, setRoomMembers] = useState<any[]>([]);

  // members 정보 파싱
  useEffect(() => {
    if (members) {
      try {
        const membersData = JSON.parse(decodeURIComponent(members));
        setRoomMembers(membersData);
        console.log('📋 과제 조회 - 파싱된 members 데이터:', membersData);
      } catch (error) {
        console.error('❌ members 파싱 실패:', error);
        setRoomMembers([]);
      }
    }
  }, [members]);

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

  // 현재 사용자 정보 로드
  useEffect(() => {
    loadCurrentUserInfo();
  }, []);

  // 과제 상세 정보 로드 (roomMembers가 설정된 후에 로드)
  useEffect(() => {
    if (currentUserId !== null && (roomMembers.length > 0 || !members)) {
      loadTaskDetail();
    }
  }, [id, roomId, currentUserId, roomMembers.length]);

  const loadTaskDetail = async () => {
    if (!id || !roomId) return;

    try {
      setIsLoading(true);
      console.log('🚀 과제 상세 정보 로드:', { taskId: id, roomId });

      // 토큰 상태 확인
      const token = await getAccessToken();
      console.log('🔑 현재 토큰 상태:', token ? '토큰 있음' : '토큰 없음');
      if (token) {
        console.log('🔑 토큰 길이:', token.length);
        console.log('🔑 토큰 앞 20자:', token.substring(0, 20) + '...');
      }

      // 1. 먼저 과제 목록을 가져와서 해당 과제 찾기
      const tasks = await TaskService.getTasks(Number(roomId));
      const targetTask = tasks.find((task) => task.assignmentId === Number(id));

      if (targetTask) {
        // 백엔드 Task를 UI용 TaskWithMembers로 변환
        const memberMap = new Map<number, TaskMember>();

        // 실제 roomMembers 정보를 TaskMember 형식으로 변환
        roomMembers.forEach((member) => {
          const name =
            member.roomRole === 'LEADER' ? `${member.name}(팀장)` : member.name;
          memberMap.set(member.memberId, {
            id: member.memberId,
            name: name,
            hasSubmitted: false,
          });
        });

        const transformedTask = TaskService.transformTaskForUI(
          targetTask,
          memberMap
        );
        setTaskInfo(transformedTask);
        console.log('✅ 과제 상세 정보 로드 성공:', transformedTask);
      } else {
        console.error('❌ 과제를 찾을 수 없습니다:', id);
        Alert.alert('오류', '과제 정보를 찾을 수 없습니다.');
        router.back();
      }
    } catch (error: any) {
      console.error('❌ 과제 상세 정보 로드 실패:', error);
      Alert.alert('로드 실패', '과제 정보를 불러오는 중 오류가 발생했습니다.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  // 본인이 할당된 과제인지 확인
  const isAssignedToMe = () => {
    if (!currentUserId || !taskInfo) return false;
    return taskInfo.assignedMemberIds.includes(currentUserId);
  };

  // 본인의 제출 상태 확인
  const getMySubmissionStatus = () => {
    if (!currentUserId || !taskInfo) return false;
    const myMember = taskInfo.assignedMembers.find(
      (member) => member.id === currentUserId
    );
    return myMember ? myMember.hasSubmitted : false;
  };

  // 파일 업로드
  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadedFiles((prev) => [...prev, result]);
      }
    } catch (error) {
      Alert.alert('오류', '파일 업로드 중 오류가 발생했습니다.');
    }
  };

  // 파일 제거
  const handleFileRemove = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 과제 제출
  const handleSubmitTask = async () => {
    if (submissionText.trim() === '' && uploadedFiles.length === 0) {
      Alert.alert('알림', '제출 내용이나 파일을 추가해주세요.');
      return;
    }

    if (!taskInfo) {
      Alert.alert('오류', '과제 정보를 찾을 수 없습니다.');
      return;
    }

    Alert.alert('과제 제출', '과제를 제출하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '제출',
        onPress: async () => {
          try {
            console.log('🚀 과제 제출:', {
              taskId: taskInfo.assignmentId,
              content: submissionText,
              files: uploadedFiles,
            });

            // 파일 업로드 처리
            const fileIds: number[] = [];

            if (uploadedFiles.length > 0) {
              console.log('📁 파일 업로드 시작:', uploadedFiles.length, '개');

              for (let i = 0; i < uploadedFiles.length; i++) {
                const fileResult = uploadedFiles[i];
                if (
                  fileResult.canceled ||
                  !fileResult.assets ||
                  fileResult.assets.length === 0
                ) {
                  continue;
                }

                const file = fileResult.assets[0];
                try {
                  // 파일 업로드 의도 등록
                  const uploadIntent = await FileService.getUploadIntent(
                    Number(roomId),
                    {
                      fileName: file.name || 'Unknown File',
                      size: file.size || 0,
                      contentType: file.mimeType || 'application/octet-stream',
                    }
                  );

                  // S3에 파일 업로드
                  const uploadSuccess = await FileService.uploadToS3(
                    uploadIntent.url,
                    file.uri,
                    file.mimeType || 'application/octet-stream',
                    (progress) => {
                      console.log(
                        `📤 ${file.name} 업로드 진행률: ${progress}%`
                      );
                    }
                  );

                  if (uploadSuccess) {
                    // 업로드 완료 등록
                    const completeResponse = await FileService.completeUpload(
                      Number(roomId),
                      uploadIntent.key
                    );

                    fileIds.push(completeResponse.fileId);
                    console.log(
                      `✅ ${file.name} 업로드 완료, fileId: ${completeResponse.fileId}`
                    );
                  } else {
                    console.error(`❌ ${file.name} 업로드 실패`);
                  }
                } catch (error) {
                  console.error(`❌ ${file.name} 업로드 중 오류:`, error);
                }
              }
            }

            await TaskService.submitTask(Number(roomId), {
              taskId: taskInfo.assignmentId,
              content: submissionText,
              fileIds: fileIds,
            });

            console.log('✅ 과제 제출 성공');

            // 제출 후 즉시 상태 업데이트
            const submittedAt = new Date().toISOString();
            if (taskInfo && currentUserId) {
              setTaskInfo((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  assignedMembers: prev.assignedMembers.map((member) =>
                    member.id === currentUserId
                      ? {
                          ...member,
                          hasSubmitted: true,
                          submittedAt: submittedAt,
                        }
                      : member
                  ),
                };
              });
            }

            // 제출 데이터 저장
            setMySubmissionData({
              content: submissionText,
              submittedAt: submittedAt,
            });

            // 제출 폼 초기화
            setSubmissionText('');
            setUploadedFiles([]);

            Alert.alert('완료', '과제가 성공적으로 제출되었습니다.', [
              {
                text: '확인',
                onPress: () => {
                  // 과제 정보 다시 로드 (서버에서 최신 데이터 가져오기)
                  loadTaskDetail();

                  // 자동으로 뒤로가기
                  router.back();
                },
              },
            ]);
          } catch (error: any) {
            console.error('❌ 과제 제출 실패:', error);
            Alert.alert('제출 실패', '과제 제출 중 오류가 발생했습니다.');
          }
        },
      },
    ]);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#4CAF50';
      case 'IN_PROGRESS':
        return '#FF9500';
      case 'CANCELLED':
        return '#FF3B30';
      default:
        return '#666666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '완료';
      case 'IN_PROGRESS':
        return '진행중';
      case 'CANCELLED':
        return '취소됨';
      default:
        return '알 수 없음';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>과제 확인</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>과제 정보를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  if (!taskInfo) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>과제 확인</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>과제 정보를 찾을 수 없습니다.</Text>
        </View>
      </View>
    );
  }

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
                <Text style={styles.metaText}>
                  마감: {TaskService.formatDateFromISO(taskInfo.due)}
                </Text>
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
                  생성일: {TaskService.formatDateFromISO(taskInfo.createdAt)}
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
              const isMe = currentUserId === member.id;

              return (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>
                        {member.name} {isMe && '(나)'}
                      </Text>
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
                            ({TaskService.formatDateFromISO(member.submittedAt)}
                            )
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {member.hasSubmitted && (
                    <View style={styles.submissionDetails}>
                      <View style={styles.submissionTextContainer}>
                        <Text style={styles.submissionTextLabel}>
                          제출 내용:
                        </Text>
                        <Text style={styles.submissionText}>
                          {isMe && mySubmissionData
                            ? mySubmissionData.content ||
                              '과제가 제출되었습니다.'
                            : '과제가 제출되었습니다.'}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* 본인에게 할당된 과제이고 아직 제출하지 않은 경우 제출 폼 표시 */}
                  {isMe && !member.hasSubmitted && (
                    <View style={styles.submissionForm}>
                      <Text style={styles.submissionFormTitle}>과제 제출</Text>

                      {/* 제출 내용 입력 */}
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>제출 내용</Text>
                        <TextInput
                          style={styles.textInput}
                          value={submissionText}
                          onChangeText={setSubmissionText}
                          placeholder="과제 제출 내용을 입력하세요..."
                          placeholderTextColor="#666666"
                          multiline
                          numberOfLines={4}
                        />
                      </View>

                      {/* 파일 첨부 */}
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>파일 첨부</Text>
                        <TouchableOpacity
                          style={styles.uploadButton}
                          onPress={handleFileUpload}
                        >
                          <Ionicons
                            name="cloud-upload"
                            size={20}
                            color="#007AFF"
                          />
                          <Text style={styles.uploadButtonText}>파일 선택</Text>
                        </TouchableOpacity>

                        {/* 업로드된 파일 목록 */}
                        {uploadedFiles.length > 0 && (
                          <View style={styles.fileList}>
                            {uploadedFiles.map((fileResult, index) => {
                              if (
                                fileResult.canceled ||
                                !fileResult.assets ||
                                fileResult.assets.length === 0
                              ) {
                                return null;
                              }
                              const file = fileResult.assets[0];
                              return (
                                <View key={index} style={styles.fileItem}>
                                  <View style={styles.fileInfo}>
                                    <Ionicons
                                      name="document"
                                      size={16}
                                      color="#007AFF"
                                    />
                                    <View style={styles.fileDetails}>
                                      <Text style={styles.fileName}>
                                        {file.name || 'Unknown File'}
                                      </Text>
                                      <Text style={styles.fileSize}>
                                        {formatFileSize(file.size || 0)}
                                      </Text>
                                    </View>
                                  </View>
                                  <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => handleFileRemove(index)}
                                  >
                                    <Ionicons
                                      name="close"
                                      size={14}
                                      color="#FF3B30"
                                    />
                                  </TouchableOpacity>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>

                      {/* 제출 버튼 */}
                      <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmitTask}
                      >
                        <Text style={styles.submitButtonText}>과제 제출</Text>
                      </TouchableOpacity>
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
  submissionForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#292929',
  },
  submissionFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#292929',
    textAlignVertical: 'top',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121216',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  fileList: {
    marginTop: 8,
    gap: 6,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121216',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#292929',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 8,
    flex: 1,
  },
  fileName: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 10,
    color: '#888888',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
