// AppleLoginButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import apiClient from '../services/api';
import { registerPushToken } from '../services/pushNotificationService';

interface Props {
  onLoginSuccess: (result: any) => void;
  onLoginError: (error: string) => void;
}

export default function AppleLoginButton({
  onLoginSuccess,
  onLoginError,
}: Props) {
  const handleAppleLogin = async () => {
    try {
      console.log('🍎 네이티브 애플 로그인 시작');

      // iOS에서만 애플 로그인 사용 가능
      if (Platform.OS !== 'ios') {
        onLoginError('애플 로그인은 iOS에서만 사용할 수 있습니다.');
        return;
      }

      // 애플 로그인 가능 여부 확인
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        onLoginError('이 기기에서는 애플 로그인을 사용할 수 없습니다.');
        return;
      }

      // 애플 로그인 요청
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('🍎 애플 로그인 성공:', credential);

      // 서버에 전송할 데이터 구성 (API 스펙에 맞춤)
      const body = {
        accessIdToken: credential.identityToken, // JWT 토큰
        name: credential.fullName
          ? `${credential.fullName.givenName || ''} ${
              credential.fullName.familyName || ''
            }`.trim()
          : null, // 최초 로그인 시에만 fullName이 제공됨
      };

      console.log('📤 POST /api/auth/app/apple 요청 시작');
      console.log('📤 전송할 데이터:', body);

      // 백엔드 API 호출
      const response = await apiClient.post('/api/auth/app/apple', body);
      console.log('✅ 서버 응답 성공!');
      console.log('✅ 응답 데이터:', response.data);

      if (response.data?.accessToken) {
        console.log('✅ 로그인 성공! 토큰 저장 중...');

        // 토큰 저장
        const { saveTokens } = await import('../services/tokenManager');
        await saveTokens({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          loginType: 'apple',
          user: response.data.user,
        });

        // Push Token 등록
        await registerPushToken();

        onLoginSuccess(response.data);
      } else {
        console.error('❌ 서버 응답에 액세스 토큰이 없습니다!');
        onLoginError(response.data?.message || '로그인에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('❌ 애플 로그인 에러:', error);

      // 사용자가 취소한 경우
      if (error.code === 'ERR_CANCELED') {
        console.log('🍎 사용자가 애플 로그인을 취소했습니다.');
        return; // 에러 메시지 표시하지 않음
      }

      // 기타 에러
      let errorMessage = '애플 로그인 중 오류가 발생했습니다.';
      if (error.message) {
        errorMessage = error.message;
      }

      onLoginError(errorMessage);
    }
  };

  // iOS가 아닌 경우 버튼 비활성화
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={5}
      style={styles.button}
      onPress={handleAppleLogin}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: 60,
    height: 60,
  },
});
