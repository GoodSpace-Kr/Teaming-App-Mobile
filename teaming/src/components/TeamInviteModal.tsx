// TeamInviteModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

interface TeamInviteModalProps {
  visible: boolean;
  onClose: () => void;
  onEnterRoom: () => void;
  teamName: string;
  inviteCode: string;
  roomId?: number | null;
}

const { width } = Dimensions.get('window');

export default function TeamInviteModal({
  visible,
  onClose,
  onEnterRoom,
  teamName,
  inviteCode,
  roomId,
}: TeamInviteModalProps) {
  const [copied, setCopied] = useState(false);

  // 초대 링크 생성 (실제 앱 스토어 링크로 변경 예정)
  const inviteLink = `https://teaming.app/join/${inviteCode}`;

  // roomId 로깅 (디버깅용)
  useEffect(() => {
    if (roomId) {
      console.log('🏠 TeamInviteModal에서 받은 roomId:', roomId);
    }
  }, [roomId]);

  // 링크 복사
  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(inviteLink);
      setCopied(true);
      Alert.alert('복사 완료', '초대 링크가 클립보드에 복사되었습니다.');

      // 2초 후 복사 상태 초기화
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      Alert.alert('오류', '링크 복사에 실패했습니다.');
    }
  };

  // 카카오톡 공유
  const handleKakaoShare = async () => {
    try {
      const shareMessage = `🎉 ${teamName} 팀에 초대받았습니다!\n\n초대 코드: ${inviteCode}\n\n링크: ${inviteLink}`;

      await Share.share({
        message: shareMessage,
        title: `${teamName} 팀 초대`,
      });
    } catch (error) {
      console.error('카카오톡 공유 실패:', error);
      Alert.alert('오류', '공유에 실패했습니다.');
    }
  };

  // 채팅방 입장
  const handleEnterRoom = () => {
    // 부모에서 모달 닫기와 네비게이션을 처리하므로 여기서는 이벤트만 전달
    onEnterRoom();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>팀 초대하기</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* 팀 정보 */}
          <View style={styles.teamInfo}>
            <View style={styles.teamIcon}>
              <Ionicons name="people" size={32} color="#4A90E2" />
            </View>
            <Text style={styles.teamName}>{teamName}</Text>
            <Text style={styles.teamDescription}>
              팀원들을 초대하여 함께 작업해보세요!
            </Text>
          </View>

          {/* 초대 코드 */}
          <View style={styles.inviteCodeSection}>
            <Text style={styles.sectionTitle}>초대 코드</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.inviteCode}>{inviteCode}</Text>
              <TouchableOpacity
                style={styles.copyCodeButton}
                onPress={() => {
                  Clipboard.setStringAsync(inviteCode);
                  Alert.alert('복사 완료', '초대 코드가 복사되었습니다.');
                }}
              >
                <Ionicons name="copy" size={16} color="#4A90E2" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 초대 링크 */}
          <View style={styles.inviteLinkSection}>
            <Text style={styles.sectionTitle}>초대 링크</Text>
            <View style={styles.linkContainer}>
              <Text style={styles.inviteLink} numberOfLines={2}>
                {inviteLink}
              </Text>
              <View style={styles.linkButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.copyButton]}
                  onPress={handleCopyLink}
                >
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy'}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.buttonText}>
                    {copied ? '복사됨' : '복사'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.shareButton]}
                  onPress={handleKakaoShare}
                >
                  <Ionicons name="share" size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>카톡 공유</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 안내 메시지 */}
          <View style={styles.infoSection}>
            <Ionicons name="information-circle" size={20} color="#4A90E2" />
            <Text style={styles.infoText}>
              초대 코드나 링크를 팀원들에게 공유하면{'\n'}
              팀에 참여할 수 있습니다.
            </Text>
          </View>

          {/* 버튼들 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.enterRoomButton}
              onPress={handleEnterRoom}
            >
              <Text style={styles.enterRoomButtonText}>
                채팅방 목록으로 이동
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#121216',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#292929',
    width: width - 40,
    maxHeight: '80%',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },

  // 팀 정보
  teamInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  teamIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  teamDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
  },

  // 초대 코드 섹션
  inviteCodeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  inviteCode: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#4A90E2',
    letterSpacing: 2,
  },
  copyCodeButton: {
    padding: 8,
  },

  // 초대 링크 섹션
  inviteLinkSection: {
    marginBottom: 24,
  },
  linkContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  inviteLink: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 16,
    lineHeight: 20,
  },
  linkButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  copyButton: {
    backgroundColor: '#4A90E2',
  },
  shareButton: {
    backgroundColor: '#FEE500',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 안내 메시지
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 12,
    lineHeight: 20,
  },

  // 버튼들
  buttonContainer: {
    gap: 12,
  },
  enterRoomButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  enterRoomButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeModalButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCCCCC',
  },
});
