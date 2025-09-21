// tokenManager.ts
import * as SecureStore from 'expo-secure-store';
import apiClient from './api';

// 토큰 키 상수
const ACCESS_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
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
    ]);
    console.log('✅ 토큰 저장 완료');
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
    const response = await apiClient.post('/api/auth/refresh', {
      refreshToken: refreshToken,
    });

    if (response.data?.accessToken) {
      await saveTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        user: response.data.user,
      });
      console.log('✅ 토큰 갱신 성공');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ 토큰 갱신 실패:', error);
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
