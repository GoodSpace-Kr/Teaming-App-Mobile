import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { TaskService } from '@/src/services/taskService';
import { TaskWithMembers, TaskMember } from '@/src/types/task';
import { getUserInfo } from '@/src/services/api';
import { getAccessToken } from '@/src/services/tokenManager';

const { width } = Dimensions.get('window');

interface TaskInfo {
  id: number;
  title: string;
  description: string;
  deadline: string;
  assignedMembers: string[];
  status: 'pending' | 'submitted';
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export default function SubmitTaskScreen() {
  const { taskId, roomId } = useLocalSearchParams<{
    taskId?: string;
    roomId?: string;
  }>();

  const [taskInfo, setTaskInfo] = useState<TaskWithMembers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

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
  React.useEffect(() => {
    loadCurrentUserInfo();
  }, []);

  // 과제 정보 로드
  React.useEffect(() => {
    if (currentUserId !== null) {
      loadTaskInfo();
    }
  }, [taskId, roomId, currentUserId]);

  const loadTaskInfo = async () => {
    if (!taskId || !roomId) {
      // 파라미터가 없으면 에러 처리
      console.error('❌ taskId 또는 roomId가 없습니다');
      Alert.alert('오류', '과제 정보를 찾을 수 없습니다.');
      router.back();
      return;
    }

    try {
      setIsLoading(true);
      console.log('🚀 과제 정보 로드:', { taskId, roomId });

      // ID 유효성 검증
      const roomIdNumber = Number(roomId);
      const taskIdNumber = Number(taskId);

      if (isNaN(roomIdNumber) || isNaN(taskIdNumber)) {
        console.error('❌ 유효하지 않은 ID:', { roomId, taskId });
        Alert.alert('오류', '유효하지 않은 과제 또는 채팅방 ID입니다.');
        router.back();
        return;
      }

      // 과제 목록을 가져와서 해당 과제 찾기
      const tasks = await TaskService.getTasks(roomIdNumber);
      const targetTask = tasks.find(
        (task) => task.assignmentId === taskIdNumber
      );

      if (targetTask) {
        const transformedTask = TaskService.transformTaskForUI(
          targetTask,
          memberMap
        );
        setTaskInfo(transformedTask);
        console.log('✅ 과제 정보 로드 성공:', transformedTask);
      } else {
        console.error('❌ 과제를 찾을 수 없습니다:', taskId);
        Alert.alert('오류', '과제 정보를 찾을 수 없습니다.');
        router.back();
      }
    } catch (error: any) {
      console.error('❌ 과제 정보 로드 실패:', error);
      Alert.alert('로드 실패', '과제 정보를 불러오는 중 오류가 발생했습니다.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const newFile: UploadedFile = {
          id: Date.now().toString(),
          name: file.name || 'Unknown File',
          size: file.size || 0,
          type: file.mimeType || 'Unknown Type',
        };
        setUploadedFiles((prev) => [...prev, newFile]);
      }
    } catch (error) {
      Alert.alert('오류', '파일 업로드 중 오류가 발생했습니다.');
    }
  };

  const handleFileRemove = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

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

            // TODO: 파일 업로드 API 호출 후 fileIds 받기
            const fileIds: number[] = []; // 실제로는 업로드된 파일의 ID들

            // roomId 유효성 재검증
            const roomIdNumber = Number(roomId);
            if (isNaN(roomIdNumber)) {
              console.error('❌ 유효하지 않은 roomId:', roomId);
              Alert.alert('오류', '유효하지 않은 채팅방 ID입니다.');
              return;
            }

            await TaskService.submitTask(roomIdNumber, {
              taskId: taskInfo.assignmentId,
              content: submissionText,
              fileIds: fileIds,
            });

            console.log('✅ 과제 제출 성공');
            Alert.alert('완료', '과제가 성공적으로 제출되었습니다.', [
              {
                text: '확인',
                onPress: () => {
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>과제 제출</Text>
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
          <Text style={styles.headerTitle}>과제 제출</Text>
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
        <Text style={styles.headerTitle}>과제 제출</Text>
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
                <Ionicons name="person" size={16} color="#666666" />
                <Text style={styles.metaText}>
                  생성자: {taskInfo.createdBy}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 제출 내용 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제출 내용</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={submissionText}
            onChangeText={setSubmissionText}
            placeholder="과제 제출 내용을 입력하세요..."
            placeholderTextColor="#666666"
            multiline
            numberOfLines={6}
          />
        </View>

        {/* 파일 업로드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>파일 첨부</Text>

          {/* 업로드 버튼 */}
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleFileUpload}
          >
            <Ionicons name="cloud-upload" size={24} color="#007AFF" />
            <Text style={styles.uploadButtonText}>파일 선택</Text>
          </TouchableOpacity>

          {/* 업로드된 파일 목록 */}
          {uploadedFiles.length > 0 && (
            <View style={styles.fileList}>
              {uploadedFiles.map((file) => (
                <View key={file.id} style={styles.fileItem}>
                  <View style={styles.fileInfo}>
                    <Ionicons name="document" size={20} color="#007AFF" />
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName}>{file.name}</Text>
                      <Text style={styles.fileSize}>
                        {formatFileSize(file.size)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleFileRemove(file.id)}
                  >
                    <Ionicons name="close" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 제출 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitTask}
        >
          <Text style={styles.submitButtonText}>과제 제출</Text>
        </TouchableOpacity>
      </View>
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
  textInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#292929',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121216',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  fileList: {
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121216',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#292929',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#000000',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
