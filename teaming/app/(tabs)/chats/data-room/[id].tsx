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
  Linking,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FileService } from '@/src/services/fileService';
import { FileItem, RoomFileResponse } from '@/src/types/file';

const { width } = Dimensions.get('window');

// FileItem 타입은 이미 import했으므로 중복 제거

export default function DataRoomScreen() {
  const { id, members, title } = useLocalSearchParams();
  const roomId = parseInt(id as string, 10);

  // 상태 관리
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomMembers, setRoomMembers] = useState<any[]>([]);

  // members 정보 파싱
  useEffect(() => {
    if (members) {
      try {
        const membersData = JSON.parse(decodeURIComponent(members as string));
        setRoomMembers(membersData);
        console.log('📋 자료실 - 파싱된 members 데이터:', membersData);
      } catch (error) {
        console.error('❌ members 파싱 실패:', error);
        setRoomMembers([]);
      }
    }
  }, [members]);

  // 파일 목록 로드 (roomMembers가 설정된 후에 로드)
  useEffect(() => {
    if (roomMembers.length > 0 || !members) {
      loadFiles();
    }
  }, [roomId, roomMembers.length]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📁 자료실 파일 목록 로드 시작:', { roomId });

      const roomFiles = await FileService.getRoomFiles(roomId);
      const convertedFiles = roomFiles.map((roomFile) => {
        const memberInfo = getMemberInfo(roomFile.uploaderId);
        const fileItem = FileService.convertRoomFileToFileItem(roomFile);
        return {
          ...fileItem,
          uploadedBy: memberInfo.name,
          uploadedByAvatar: memberInfo.avatarUrl,
        };
      });

      setFiles(convertedFiles);
      console.log(
        '✅ 자료실 파일 목록 로드 완료:',
        convertedFiles.length,
        '개 파일'
      );
    } catch (err: any) {
      console.error('❌ 자료실 파일 목록 로드 실패:', err);
      setError('파일 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // uploaderId로 멤버 정보 찾기
  const getMemberInfo = (uploaderId: number) => {
    const member = roomMembers.find((m) => m.memberId === uploaderId);
    if (member) {
      return {
        name: member.name,
        avatarUrl: member.avatarUrl || member.avatarKey,
        role: member.roomRole,
      };
    }
    return {
      name: `사용자 ${uploaderId}`,
      avatarUrl: null,
      role: 'MEMBER',
    };
  };

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
        // 파일 ID가 없는 경우 파일 정보만 표시
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
          name={file.fileIcon as any}
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

          {loading ? (
            <View style={styles.loadingSection}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>파일 목록을 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorSection}>
              <Ionicons name="alert-circle" size={48} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadFiles}>
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : files.length > 0 ? (
            files.map(renderFileItem)
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="folder-open" size={48} color="#666666" />
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
  uploaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploaderAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
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
    marginTop: 12,
  },
  loadingSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 12,
  },
  errorSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
