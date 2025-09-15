import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleBackPress = () => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSubmit = () => {
    // 유효성 검사
    if (!currentPassword.trim()) {
      Alert.alert('오류', '현재 비밀번호를 입력해주세요.');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('오류', '새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 규칙 검사
    if (newPassword.length < 8) {
      Alert.alert('오류', '비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    // TODO: 비밀번호 변경 API 호출
    Alert.alert('완료', '비밀번호가 성공적으로 변경되었습니다.');
    router.back();
  };

  const isFormValid =
    currentPassword.trim() && newPassword.trim() && confirmPassword.trim();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>비밀번호 변경</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {/* 현재 비밀번호 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>
            현재 비밀번호 <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="현재 비밀번호를 입력해주세요"
            placeholderTextColor="#666666"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
        </View>

        {/* 새 비밀번호 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>
            새 비밀번호 <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="새 비밀번호를 입력해주세요"
            placeholderTextColor="#666666"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          {/* 비밀번호 규칙 */}
          <View style={styles.rulesContainer}>
            <Text style={styles.ruleText}>
              ✓ 영문, 숫자, 특수문자 포함 8자 이상
            </Text>
            <Text style={styles.ruleText}>✓ 연속 문자 불가</Text>
            <Text style={styles.ruleText}>✓ 이메일(아이디) 불가</Text>
          </View>
        </View>

        {/* 새 비밀번호 확인 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>
            새 비밀번호 확인 <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="새 비밀번호를 다시 입력해주세요"
            placeholderTextColor="#666666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            !isFormValid && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid}
        >
          <Text
            style={[
              styles.submitButtonText,
              !isFormValid && styles.submitButtonTextDisabled,
            ]}
          >
            등록
          </Text>
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
    paddingTop: 20,
  },
  inputSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    fontSize: 16,
    color: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF',
    paddingVertical: 8,
  },
  rulesContainer: {
    marginTop: 16,
  },
  ruleText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#CCCCCC',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#333333',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  submitButtonTextDisabled: {
    color: '#666666',
  },
});
