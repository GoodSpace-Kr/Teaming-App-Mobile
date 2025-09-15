import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface LeaveTeamModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  teamName: string;
}

export default function LeaveTeamModal({
  visible,
  onClose,
  onConfirm,
  teamName,
}: LeaveTeamModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 배경 오버레이 */}
      <View style={styles.overlay}>
        {/* 모달 컨테이너 */}
        <View style={styles.modalContainer}>
          {/* 팀 아이콘 */}
          <View style={styles.teamIcon}>
            <Ionicons name="people" size={32} color="#FFFFFF" />
          </View>

          {/* 팀 이름 */}
          <Text style={styles.teamName}>{teamName}</Text>

          {/* 질문 */}
          <Text style={styles.question}>티밍룸을 나가시겠어요?</Text>

          {/* 경고 메시지 */}
          <Text style={styles.warning}>
            팀플 완료 전, 티밍룸을 나갈 시 환급받지 못하고 패널티로 지불하게
            됩니다.
          </Text>

          {/* 버튼들 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.leaveButton} onPress={onConfirm}>
              <Text style={styles.leaveButtonText}>나가기</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // 배경 흐림 효과
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#121216',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
  },
  teamIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  warning: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#292929',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  leaveButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
