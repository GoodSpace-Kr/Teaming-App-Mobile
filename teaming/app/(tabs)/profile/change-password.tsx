import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { updatePassword } from '../../../src/services/api';
import { getLoginType } from '../../../src/services/tokenManager';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleBackPress = () => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  // 비밀번호 유효성 검사 함수
  const validatePassword = (
    password: string
  ): { isValid: boolean; message?: string } => {
    if (password.length < 8) {
      return { isValid: false, message: '비밀번호는 8자 이상이어야 합니다.' };
    }

    // 영문, 숫자, 특수문자 포함 검사
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasLetter || !hasNumber || !hasSpecial) {
      return {
        isValid: false,
        message: '영문, 숫자, 특수문자를 모두 포함해야 합니다.',
      };
    }

    // 연속 문자 검사 (3자 이상 연속)
    const hasConsecutive = /(.)\1{2,}/.test(password);
    if (hasConsecutive) {
      return { isValid: false, message: '연속된 문자는 사용할 수 없습니다.' };
    }

    return { isValid: true };
  };

  const handleSubmit = async () => {
    // 로그인 타입 확인 (디버깅용)
    try {
      const loginType = await getLoginType();
      console.log('🔍 현재 로그인 타입:', loginType);

      if (loginType !== 'email') {
        Alert.alert(
          '오류',
          '이메일 로그인 사용자만 비밀번호를 변경할 수 있습니다.'
        );
        return;
      }
    } catch (error) {
      console.error('로그인 타입 확인 실패:', error);
    }

    // 유효성 검사
    if (!currentPassword.trim()) {
      Alert.alert('오류', '현재 비밀번호를 입력해주세요.');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('오류', '새 비밀번호를 입력해주세요.');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('오류', '새 비밀번호 확인을 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    // 현재 비밀번호와 새 비밀번호가 같은지 확인
    if (currentPassword === newPassword) {
      Alert.alert('오류', '현재 비밀번호와 새 비밀번호가 같습니다.');
      return;
    }

    // 비밀번호 규칙 검사
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      Alert.alert('오류', passwordValidation.message);
      return;
    }

    try {
      setIsUpdating(true);

      console.log('🔐 비밀번호 변경 시도');
      console.log('현재 비밀번호 길이:', currentPassword.length);
      console.log('새 비밀번호 길이:', newPassword.length);

      await updatePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      console.log('✅ 비밀번호 변경 성공');
      Alert.alert('성공', '비밀번호가 성공적으로 변경되었습니다.', [
        {
          text: '확인',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('❌ 비밀번호 변경 실패:', error);
      console.error('에러 상태 코드:', error.response?.status);
      console.error('에러 응답 데이터:', error.response?.data);

      let errorMessage = '비밀번호 변경 중 오류가 발생했습니다.';

      if (error.response?.status === 400) {
        errorMessage = '현재 비밀번호가 올바르지 않습니다.';
      } else if (error.response?.status === 401) {
        errorMessage = '현재 비밀번호가 올바르지 않습니다.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('비밀번호 변경 실패', errorMessage);
    } finally {
      setIsUpdating(false);
    }
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
            <Text style={styles.ruleText}>✓ 연속된 문자 3자 이상 불가</Text>
            <Text style={styles.ruleText}>✓ 현재 비밀번호와 다르게 설정</Text>
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
            (!isFormValid || isUpdating) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid || isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.submitButtonText,
                (!isFormValid || isUpdating) && styles.submitButtonTextDisabled,
              ]}
            >
              등록
            </Text>
          )}
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
    color: '#000000',
  },
  submitButtonTextDisabled: {
    color: '#666666',
  },
});
