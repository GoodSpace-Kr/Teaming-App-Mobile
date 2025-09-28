import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import FileChatBubble from './FileChatBubble';

interface FileAttachment {
  fileId: number;
  fileName: string;
  contentType: string;
  size?: number;
}

interface ChatBubbleProps {
  text: string;
  isMe: boolean;
  showTail: boolean;
  isContinuous: boolean;
  timestamp: string;
  readCount?: number;
  backgroundColor?: string;
  textColor?: string;
  attachments?: FileAttachment[];
}

export default function ChatBubble({
  text,
  isMe,
  showTail,
  isContinuous,
  timestamp,
  readCount,
  backgroundColor = '#333333',
  textColor = '#FFFFFF',
  attachments,
}: ChatBubbleProps) {
  const bubbleStyle: ViewStyle = {
    backgroundColor,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '78%',
    position: 'relative',
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

  // 파일 첨부가 있는 경우 FileChatBubble 사용
  if (attachments && attachments.length > 0) {
    return (
      <FileChatBubble
        attachments={attachments}
        isMe={isMe}
        showTail={showTail}
        isContinuous={isContinuous}
        timestamp={timestamp}
        readCount={readCount}
        backgroundColor={backgroundColor}
        textColor={textColor}
      />
    );
  }

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
        <Text style={[styles.text, { color: textColor }]}>{text}</Text>
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
  text: {
    fontSize: 16,
    lineHeight: 22,
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
    right: 4, // 내 메시지: 우측 정렬 (마지막 글자 위)
    color: '#ffd400',
  },
  otherReadCount: {
    left: 0, // 다른 사람 메시지: 좌측 정렬 (첫 글자 위)
  },
});
