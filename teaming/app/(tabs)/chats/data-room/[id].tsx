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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  category: 'chat' | 'task';
  fileIcon: string;
}

export default function DataRoomScreen() {
  const { id } = useLocalSearchParams();

  // 목데이터 - 실제 API 연동 시 대체
  const [files] = useState<FileItem[]>([
    {
      id: '1',
      name: '정치학_발표자료.pptx',
      size: 5242880, // 5MB
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      uploadedBy: '팀장 최순조',
      uploadedAt: '2025년 09월 05일 14:30',
      category: 'chat',
      fileIcon: 'document-text',
    },
    {
      id: '2',
      name: '참고문헌_정치학.pdf',
      size: 2097152, // 2MB
      type: 'application/pdf',
      uploadedBy: '권민석',
      uploadedAt: '2025년 09월 06일 16:45',
      category: 'task',
      fileIcon: 'document',
    },
    {
      id: '3',
      name: '회의록_0905.hwp',
      size: 1048576, // 1MB
      type: 'application/x-hwp',
      uploadedBy: '정치학존잘남',
      uploadedAt: '2025년 09월 05일 15:20',
      category: 'chat',
      fileIcon: 'document-text',
    },
    {
      id: '4',
      name: '발표_스크립트.txt',
      size: 51200, // 50KB
      type: 'text/plain',
      uploadedBy: '팀플하기싫다',
      uploadedAt: '2025년 09월 06일 10:15',
      category: 'chat',
      fileIcon: 'document-text',
    },
    {
      id: '5',
      name: '정치학_이미지1.jpg',
      size: 3145728, // 3MB
      type: 'image/jpeg',
      uploadedBy: '권민석',
      uploadedAt: '2025년 09월 06일 17:30',
      category: 'chat',
      fileIcon: 'image',
    },
    {
      id: '6',
      name: '발표_동영상.mp4',
      size: 52428800, // 50MB
      type: 'video/mp4',
      uploadedBy: '팀장 최순조',
      uploadedAt: '2025년 09월 07일 09:00',
      category: 'chat',
      fileIcon: 'videocam',
    },
    {
      id: '7',
      name: '과제_제출_자료.pdf',
      size: 1572864, // 1.5MB
      type: 'application/pdf',
      uploadedBy: '정치학존잘남',
      uploadedAt: '2025년 09월 07일 08:30',
      category: 'task',
      fileIcon: 'document',
    },
    {
      id: '8',
      name: '정치학_요약본.docx',
      size: 2621440, // 2.5MB
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedBy: '권민석',
      uploadedAt: '2025년 09월 07일 11:45',
      category: 'task',
      fileIcon: 'document-text',
    },
  ]);

  const handleBackPress = () => {
    router.back();
  };

  const handleFilePress = (file: FileItem) => {
    Alert.alert(
      '파일 정보',
      `파일명: ${file.name}\n크기: ${formatFileSize(file.size)}\n업로드: ${
        file.uploadedBy
      }\n시간: ${file.uploadedAt}`,
      [{ text: '확인' }]
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: FileItem) => {
    const iconMap: { [key: string]: string } = {
      'application/pdf': 'document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        'easel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'document-text',
      'application/x-hwp': 'document-text',
      'text/plain': 'document-text',
      'image/jpeg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
      'video/mp4': 'videocam',
      'video/avi': 'videocam',
      'video/mov': 'videocam',
    };
    return iconMap[file.type] || 'document';
  };

  const getFileIconColor = (file: FileItem) => {
    const colorMap: { [key: string]: string } = {
      'application/pdf': '#FF3B30', // 빨간색
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        '#FF9500', // 주황색
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        '#007AFF', // 파란색
      'application/x-hwp': '#34C759', // 초록색
      'text/plain': '#8E8E93', // 회색
      'image/jpeg': '#FF2D92', // 핑크색
      'image/png': '#FF2D92',
      'image/gif': '#FF2D92',
      'video/mp4': '#AF52DE', // 보라색
      'video/avi': '#AF52DE',
      'video/mov': '#AF52DE',
    };
    return colorMap[file.type] || '#8E8E93';
  };

  const getCategoryText = (category: string) => {
    return category === 'chat' ? '채팅' : '과제';
  };

  const getCategoryColor = (category: string) => {
    return category === 'chat' ? '#007AFF' : '#4CAF50';
  };

  const renderFileItem = (file: FileItem) => (
    <TouchableOpacity
      key={file.id}
      style={styles.fileItem}
      onPress={() => handleFilePress(file)}
    >
      <View style={styles.fileIconContainer}>
        <Ionicons
          name={getFileIcon(file) as any}
          size={24}
          color={getFileIconColor(file)}
        />
      </View>

      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {file.name}
        </Text>
        <View style={styles.fileMeta}>
          <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
          <Text style={styles.fileSeparator}>•</Text>
          <Text style={styles.fileUploader}>{file.uploadedBy}</Text>
        </View>
        <Text style={styles.fileDate}>{file.uploadedAt}</Text>
      </View>

      <View style={styles.fileCategory}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: getCategoryColor(file.category) },
          ]}
        >
          <Text style={styles.categoryText}>
            {getCategoryText(file.category)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const chatFiles = files.filter((file) => file.category === 'chat');
  const taskFiles = files.filter((file) => file.category === 'task');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>자료실</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 채팅 파일 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>
              채팅 파일 ({chatFiles.length})
            </Text>
          </View>
          {chatFiles.length > 0 ? (
            chatFiles.map(renderFileItem)
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>
                채팅에서 공유된 파일이 없습니다
              </Text>
            </View>
          )}
        </View>

        {/* 과제 파일 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>
              과제 파일 ({taskFiles.length})
            </Text>
          </View>
          {taskFiles.length > 0 ? (
            taskFiles.map(renderFileItem)
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>
                과제로 제출된 파일이 없습니다
              </Text>
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
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121216',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#292929',
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  fileSeparator: {
    fontSize: 14,
    color: '#666666',
    marginHorizontal: 8,
  },
  fileUploader: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  fileDate: {
    fontSize: 12,
    color: '#888888',
  },
  fileCategory: {
    marginLeft: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
  },
});
