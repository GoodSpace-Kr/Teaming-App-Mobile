import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface TeamCompletionSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  teamName: string;
}

export default function TeamCompletionSuccessModal({
  visible,
  onClose,
  teamName,
}: TeamCompletionSuccessModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 성공 아이콘 */}
          <View style={styles.iconContainer}>
            <Ionicons name="trophy" size={80} color="#FFD700" />
          </View>

          {/* 제목 */}
          <Text style={styles.title}>팀플 완료!</Text>

          {/* 설명 */}
          <Text style={styles.description}>
            <Text style={styles.teamName}>{teamName}</Text> 팀플을{'\n'}
            성공적으로 완료하였습니다.
          </Text>

          {/* 환급 안내 */}
          <Text style={styles.refundMessage}>
            💰 결제한 금액이 모두 환급되셨습니다.
          </Text>

          {/* 확인 버튼 */}
          <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
            <Text style={styles.confirmButtonText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#121216',
    borderRadius: 24,
    padding: 32,
    width: width * 0.85,
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
  },
  teamName: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  refundMessage: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  congratulations: {
    fontSize: 20,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
