import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileService } from '@/src/services/fileService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface FileAttachment {
  fileId: number;
  fileName: string;
  contentType: string;
  size?: number;
}

interface FileChatBubbleProps {
  attachments: FileAttachment[];
  isMe: boolean;
  showTail: boolean;
  isContinuous: boolean;
  timestamp: string;
  readCount?: number;
  backgroundColor?: string;
  textColor?: string;
}

export default function FileChatBubble({
  attachments,
  isMe,
  showTail,
  isContinuous,
  timestamp,
  readCount,
  backgroundColor = '#121216',
  textColor = '#FFFFFF',
}: FileChatBubbleProps) {
  const [downloading, setDownloading] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [downloadUrls, setDownloadUrls] = useState<{ [key: number]: string }>(
    {}
  );

  const bubbleStyle: ViewStyle = {
    backgroundColor,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '78%',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#292929',
  };

  // 간단한 카카오톡 스타일: 첫 메시지 vs 연속 메시지
  if (isContinuous) {
    // 연속 메시지: 기본 둥글게
    bubbleStyle.borderRadius = 16;
  } else {
    // 첫 번째 메시지: 기본 둥글게 + 상단 모서리 각지게
    bubbleStyle.borderRadius = 16;
    if (isMe) {
      bubbleStyle.borderTopRightRadius = 0; // 우측 상단 각지게
    } else {
      bubbleStyle.borderTopLeftRadius = 0; // 좌측 상단 각지게
    }
  }

  const handleFilePress = async (attachment: FileAttachment) => {
    try {
      setDownloading((prev) => ({ ...prev, [attachment.fileId]: true }));

      // 이미 다운로드 URL이 있으면 재사용
      if (downloadUrls[attachment.fileId]) {
        await handleFileAction(attachment, downloadUrls[attachment.fileId]);
        return;
      }

      // 다운로드 URL 발급
      const downloadResponse = await FileService.getDownloadUrl(
        attachment.fileId
      );
      setDownloadUrls((prev) => ({
        ...prev,
        [attachment.fileId]: downloadResponse.url,
      }));

      await handleFileAction(attachment, downloadResponse.url);
    } catch (error: any) {
      console.error('❌ 파일 다운로드 실패:', error);
      Alert.alert('오류', '파일을 다운로드할 수 없습니다.');
    } finally {
      setDownloading((prev) => ({ ...prev, [attachment.fileId]: false }));
    }
  };

  const handleFileAction = async (attachment: FileAttachment, url: string) => {
    const { fileName } = attachment;

    // 모든 파일을 다운로드 후 공유
    try {
      const localUri = await downloadFile(url, fileName);
      await shareFile(localUri, fileName);
    } catch (error) {
      console.error('❌ 파일 다운로드 실패:', error);
      Alert.alert('오류', '파일을 다운로드할 수 없습니다.');
    }
  };

  const downloadFile = async (
    url: string,
    fileName: string
  ): Promise<string> => {
    const fileUri = FileSystem.documentDirectory + fileName;
    const downloadResult = await FileSystem.downloadAsync(url, fileUri);
    return downloadResult.uri;
  };

  const shareFile = async (uri: string, fileName: string) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/octet-stream',
          dialogTitle: fileName,
        });
      } else {
        Alert.alert('오류', '공유 기능을 사용할 수 없습니다.');
      }
    } catch (error) {
      console.error('❌ 파일 공유 실패:', error);
      Alert.alert('오류', '파일을 공유할 수 없습니다.');
    }
  };

  const getFileIcon = (contentType: string) => {
    return FileService.getFileIcon(contentType);
  };

  const getFileIconColor = (contentType: string) => {
    return FileService.getFileIconColor(contentType);
  };

  const formatFileSize = (size?: number) => {
    if (!size) return '';
    return FileService.formatFileSize(size);
  };

  const renderFileAttachment = (attachment: FileAttachment, index: number) => {
    const isDownloading = downloading[attachment.fileId];
    const iconName = getFileIcon(attachment.contentType);
    const iconColor = getFileIconColor(attachment.contentType);

    return (
      <TouchableOpacity
        key={`${attachment.fileId}-${index}`}
        style={styles.fileItem}
        onPress={() => handleFilePress(attachment)}
        disabled={isDownloading}
      >
        <View style={styles.fileIconContainer}>
          {isDownloading ? (
            <ActivityIndicator
              size="small"
              color={isMe ? '#FFFFFF' : '#007AFF'}
            />
          ) : (
            <Ionicons
              name="download-outline"
              size={24}
              color={isMe ? '#FFFFFF' : '#007AFF'}
            />
          )}
        </View>

        <View style={styles.fileInfo}>
          <Text
            style={[styles.fileName, { color: textColor }]}
            numberOfLines={1}
          >
            {attachment.fileName}
          </Text>
          {attachment.size && (
            <Text style={styles.fileSize}>
              용량: {formatFileSize(attachment.size)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        isMe ? styles.myContainer : styles.otherContainer,
      ]}
    >
      {/* 내 메시지일 때는 시간을 먼저 표시 */}
      {isMe && (
        <View style={styles.metaContainer}>
          <View style={styles.timestampWrapper}>
            {!!readCount && (
              <Text style={[styles.readCount, styles.myReadCount]}>
                {readCount}
              </Text>
            )}
            <Text style={[styles.timestamp, styles.myTimestamp]}>
              {timestamp}
            </Text>
          </View>
        </View>
      )}

      <View style={bubbleStyle}>
        {attachments.map((attachment, index) =>
          renderFileAttachment(attachment, index)
        )}
      </View>

      {/* 다른 사람 메시지일 때는 시간을 나중에 표시 */}
      {!isMe && (
        <View style={styles.metaContainer}>
          <View style={styles.timestampWrapper}>
            <Text style={[styles.timestamp, styles.otherTimestamp]}>
              {timestamp}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    marginTop: 10,
    alignItems: 'flex-end',
  },
  myContainer: {
    justifyContent: 'flex-end',
    paddingRight: -5,
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },
  metaContainer: {
    marginLeft: 5,
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timestampWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  fileSize: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  timestamp: {
    fontSize: 11,
    marginRight: 4,
  },
  myTimestamp: {
    color: '#888888',
  },
  otherTimestamp: {
    color: '#888888',
  },
  readCount: {
    fontSize: 11,
    color: '#B3D9FF',
    fontWeight: '500',
    position: 'absolute',
    top: -13,
  },
  myReadCount: {
    right: 4,
    color: '#ffd400',
  },
  otherReadCount: {
    left: 0,
  },
});
