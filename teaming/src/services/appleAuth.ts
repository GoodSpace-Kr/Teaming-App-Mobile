// appleAuth.ts
import apiClient from './api';

export interface AppleLoginRequest {
  code: string;
  redirectUri: string;
  name?: string | null; // 최초 로그인 시에만 제공됨
}

export interface AppleLoginResponse {
  accessToken: string;
  refreshToken: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

/**
 * 애플 로그인 API 호출
 * @param data 애플 로그인 요청 데이터
 * @returns 로그인 응답 데이터
 */
export const appleLogin = async (
  data: AppleLoginRequest
): Promise<AppleLoginResponse> => {
  try {
    console.log('🍎 애플 로그인 API 요청:', data);

    const response = await apiClient.post<AppleLoginResponse>(
      '/api/auth/app/apple',
      data
    );

    console.log('✅ 애플 로그인 성공:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ 애플 로그인 실패:', error);

    // 에러 응답이 있는 경우 상세 정보 로깅
    if (error.response) {
      console.error('❌ 에러 상태:', error.response.status);
      console.error('❌ 에러 데이터:', error.response.data);
    }

    throw error;
  }
};

/**
 * 애플 로그인 상태 확인 (선택적)
 * @returns 애플 로그인 가능 여부
 */
export const isAppleLoginAvailable = (): boolean => {
  // iOS에서만 애플 로그인 사용 가능
  return Platform.OS === 'ios';
};

// Platform import 추가
import { Platform } from 'react-native';
