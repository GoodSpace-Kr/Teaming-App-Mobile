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
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FileService } from '@/src/services/fileService';
import { FileItem } from '@/src/types/file';

const { width } = Dimensions.get('window');

// FileItem 타입은 이미 import했으므로 중복 제거

export default function DataRoomScreen() {
  const { id } = useLocalSearchParams();

  // 목데이터 - 실제 API 연동 시 대체 (채팅에서 공유된 파일들만)
  const [files] = useState<FileItem[]>([
    {
      id: '1',
      name: '정치학_발표자료.pptx',
      size: 5242880, // 5MB
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      uploadedBy: '팀장 최순조',
      uploadedAt: '2025년 09월 05일 14:30',
      fileIcon: 'document-text',
    },
    {
      id: '2',
      name: '회의록_0905.hwp',
      size: 1048576, // 1MB
      type: 'application/x-hwp',
      uploadedBy: '정치학존잘남',
      uploadedAt: '2025년 09월 05일 15:20',
      fileIcon: 'document-text',
    },
    {
      id: '3',
      name: '발표_스크립트.txt',
      size: 51200, // 50KB
      type: 'text/plain',
      uploadedBy: '팀플하기싫다',
      uploadedAt: '2025년 09월 06일 10:15',
      fileIcon: 'document-text',
    },
    {
      id: '4',
      name: '정치학_이미지1.jpg',
      size: 3145728, // 3MB
      type: 'image/jpeg',
      uploadedBy: '권민석',
      uploadedAt: '2025년 09월 06일 17:30',
      fileIcon: 'image',
    },
    {
      id: '5',
      name: '정치학_이미지2.png',
      size: 2097152, // 2MB
      type: 'image/png',
      uploadedBy: '정치학존잘남',
      uploadedAt: '2025년 09월 06일 18:45',
      fileIcon: 'image',
    },
    {
      id: '6',
      name: '발표_동영상.mp4',
      size: 52428800, // 50MB
      type: 'video/mp4',
      uploadedBy: '팀장 최순조',
      uploadedAt: '2025년 09월 07일 09:00',
      fileIcon: 'videocam',
    },
    {
      id: '7',
      name: '참고_논문.pdf',
      size: 1572864, // 1.5MB
      type: 'application/pdf',
      uploadedBy: '권민석',
      uploadedAt: '2025년 09월 07일 11:20',
      fileIcon: 'document',
    },
    {
      id: '8',
      name: '팀_로고.png',
      size: 512000, // 500KB
      type: 'image/png',
      uploadedBy: '팀플하기싫다',
      uploadedAt: '2025년 09월 07일 14:30',
      fileIcon: 'image',
    },
  ]);

  const handleBackPress = () => {
    router.back();
  };

  const handleFilePress = async (file: FileItem) => {
    try {
      if (file.fileId) {
        // 실제 fileId가 있는 경우 다운로드 시도
        console.log('📥 파일 다운로드 시작:', file.name);

        const downloadUrl = await FileService.downloadFile(file.fileId);

        // 브라우저나 외부 앱에서 파일 열기
        const supported = await Linking.canOpenURL(downloadUrl);
        if (supported) {
          await Linking.openURL(downloadUrl);
        } else {
          Alert.alert('오류', '이 파일을 열 수 없습니다.');
        }
      } else {
        // 목데이터인 경우 파일 정보만 표시
        Alert.alert(
          '파일 정보',
          `파일명: ${file.name}\n크기: ${FileService.formatFileSize(
            file.size
          )}\n업로드: ${file.uploadedBy}\n시간: ${file.uploadedAt}`,
          [{ text: '확인' }]
        );
      }
    } catch (error: any) {
      console.error('파일 다운로드 오류:', error);
      Alert.alert(
        '다운로드 실패',
        `파일 다운로드 중 오류가 발생했습니다.\n${
          error.message || '알 수 없는 오류'
        }`
      );
    }
  };

  // FileService의 유틸리티 함수들을 사용하므로 중복 제거

  const renderFileItem = (file: FileItem) => (
    <TouchableOpacity
      key={file.id}
      style={styles.fileItem}
      onPress={() => handleFilePress(file)}
    >
      <View style={styles.fileIconContainer}>
        <Ionicons
          name={FileService.getFileIcon(file.type) as any}
          size={24}
          color={FileService.getFileIconColor(file.type)}
        />
      </View>

      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {file.name}
        </Text>
        <View style={styles.fileMeta}>
          <Text style={styles.fileSize}>
            {FileService.formatFileSize(file.size)}
          </Text>
          <Text style={styles.fileSeparator}>•</Text>
          <Text style={styles.fileUploader}>{file.uploadedBy}</Text>
        </View>
        <Text style={styles.fileDate}>{file.uploadedAt}</Text>
      </View>
    </TouchableOpacity>
  );

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
        {/* 파일 목록 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="folder" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>채팅 파일 ({files.length})</Text>
          </View>
          {files.length > 0 ? (
            files.map(renderFileItem)
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>공유된 파일이 없습니다</Text>
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
  emptySection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
  },
});
