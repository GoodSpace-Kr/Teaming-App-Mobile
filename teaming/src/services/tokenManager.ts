// tokenManager.ts
import * as SecureStore from 'expo-secure-store';
import apiClient from './api';

// 토큰 키 상수
const ACCESS_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const LOGIN_TYPE_KEY = 'login_type';

// 로그인 타입 정의
export type LoginType = 'email' | 'kakao' | 'google' | 'naver' | 'apple';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  loginType: LoginType;
  user?: any;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  user?: any;
}

/**
 * 토큰 저장
 */
export const saveTokens = async (tokenData: TokenData): Promise<void> => {
  try {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokenData.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokenData.refreshToken),
      SecureStore.setItemAsync(LOGIN_TYPE_KEY, tokenData.loginType),
    ]);
    console.log('✅ 토큰 저장 완료 (로그인 타입:', tokenData.loginType, ')');
  } catch (error) {
    console.error('❌ 토큰 저장 실패:', error);
    throw error;
  }
};

/**
 * 액세스 토큰 가져오기
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('❌ 액세스 토큰 가져오기 실패:', error);
    return null;
  }
};

/**
 * 리프레시 토큰 가져오기
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('❌ 리프레시 토큰 가져오기 실패:', error);
    return null;
  }
};

/**
 * 로그인 타입 가져오기
 */
export const getLoginType = async (): Promise<LoginType | null> => {
  try {
    const loginType = await SecureStore.getItemAsync(LOGIN_TYPE_KEY);
    return loginType as LoginType | null;
  } catch (error) {
    console.error('❌ 로그인 타입 가져오기 실패:', error);
    return null;
  }
};

/**
 * 토큰 갱신
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      console.log('❌ 리프레시 토큰이 없습니다');
      return false;
    }

    console.log('🔄 토큰 갱신 시도...');
    const response = await apiClient.post('/users/me/access-token', {
      refreshToken: refreshToken,
    });

    if (response.data?.accessToken) {
      // 새로운 accessToken만 저장 (refreshToken은 그대로 유지)
      await SecureStore.setItemAsync(
        ACCESS_TOKEN_KEY,
        response.data.accessToken
      );
      console.log('✅ 토큰 갱신 성공');
      return true;
    }

    return false;
  } catch (error: any) {
    // 503 에러나 일시적인 서버 오류는 조용히 처리 (앱이 튕기지 않도록)
    if (error?.response?.status === 503 || error?.response?.status >= 500) {
      console.log('⚠️ 서버 일시적 오류 (503/5xx), 잠시 후 자동 재시도됩니다');
      return false;
    }
    
    // 네트워크 오류도 조용히 처리
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network')) {
      console.log('⚠️ 네트워크 오류, 잠시 후 자동 재시도됩니다');
      return false;
    }

    // 401, 403 등 인증 오류는 조용히 로그만 출력
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      console.log('⚠️ 인증 오류, 토큰 갱신 실패 (조용히 처리)');
      return false;
    }

    // 기타 에러는 개발 환경에서만 상세 로그 출력
    if (__DEV__) {
      console.error('❌ 토큰 갱신 실패:', error);
    } else {
      console.log('⚠️ 토큰 갱신 실패 (조용히 처리)');
    }
    
    return false;
  }
};

/**
 * 모든 토큰 삭제 (로그아웃)
 */
export const clearTokens = async (): Promise<void> => {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(LOGIN_TYPE_KEY),
    ]);
    console.log('✅ 토큰 삭제 완료');
  } catch (error) {
    console.error('❌ 토큰 삭제 실패:', error);
    throw error;
  }
};

/**
 * 로그인 상태 확인
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const accessToken = await getAccessToken();
    return !!accessToken;
  } catch (error) {
    console.error('❌ 로그인 상태 확인 실패:', error);
    return false;
  }
};

/**
 * 사용자 정보 가져오기 (토큰이 있는 경우)
 */
export const getCurrentUser = async (): Promise<any | null> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return null;

    const response = await apiClient.get('/api/user/profile');
    return response.data;
  } catch (error) {
    console.error('❌ 사용자 정보 가져오기 실패:', error);
    return null;
  }
};
