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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

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
  const [taskInfo] = useState<TaskInfo>({
    id: 1,
    title: '자료조사 2명 과제부여',
    description:
      '자료조사를 하겠다고 한 2명에게 과제를 부여합니다.\n제한시간에 맞춰서 과제 제출해주시면 감사하겠습니다.',
    deadline: '2025년 09월 07일 07:00',
    assignedMembers: ['권민석', '정치학존잘남'],
    status: 'pending',
  });

  const [submissionText, setSubmissionText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

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

  const handleSubmitTask = () => {
    if (submissionText.trim() === '' && uploadedFiles.length === 0) {
      Alert.alert('알림', '제출 내용이나 파일을 추가해주세요.');
      return;
    }

    Alert.alert('과제 제출', '과제를 제출하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '제출',
        onPress: () => {
          console.log('과제 제출:', { submissionText, uploadedFiles });
          Alert.alert('완료', '과제가 성공적으로 제출되었습니다.');
          router.back();
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>과제 확인/제출</Text>
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
                  담당자: {taskInfo.assignedMembers.join(', ')}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={16} color="#FF9500" />
                <Text style={[styles.metaText, styles.statusText]}>
                  상태: {taskInfo.status === 'pending' ? '미제출' : '제출완료'}
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
    fontWeight: 'bold',
    color: '#007AFF',
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
    fontWeight: 'bold',
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
  },
  metaText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 8,
  },
  statusText: {
    color: '#FF9500',
    fontWeight: '500',
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
});
