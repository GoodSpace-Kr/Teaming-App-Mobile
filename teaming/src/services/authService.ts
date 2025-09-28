// authService.ts
import { clearTokens, isLoggedIn, getCurrentUser } from './tokenManager';
import apiClient from './api';

/**
 * 로그아웃
 */
export const logout = async (): Promise<boolean> => {
  try {
    console.log('🚪 로그아웃 시작...');

    // 서버에 로그아웃 요청 (선택사항)
    try {
      await apiClient.delete('/users/me/log-out');
      console.log('✅ 서버 로그아웃 성공');
    } catch (error) {
      console.log('⚠️ 서버 로그아웃 실패 (무시):', error);
    }

    // 로컬 토큰 삭제
    await clearTokens();
    console.log('✅ 로컬 토큰 삭제 완료');

    return true;
  } catch (error) {
    console.error('❌ 로그아웃 실패:', error);
    return false;
  }
};

/**
 * 로그인 상태 확인
 */
export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const loggedIn = await isLoggedIn();
    console.log('🔍 로그인 상태:', loggedIn);
    return loggedIn;
  } catch (error) {
    console.error('❌ 로그인 상태 확인 실패:', error);
    return false;
  }
};

/**
 * 현재 사용자 정보 가져오기
 */
export const getCurrentUserInfo = async (): Promise<any | null> => {
  try {
    const user = await getCurrentUser();
    console.log('👤 현재 사용자:', user);
    return user;
  } catch (error) {
    console.error('❌ 사용자 정보 가져오기 실패:', error);
    return null;
  }
};

/**
 * 인증이 필요한 API 호출 래퍼
 */
export const authenticatedRequest = async <T>(
  requestFn: () => Promise<T>
): Promise<T | null> => {
  try {
    const isAuth = await checkAuthStatus();
    if (!isAuth) {
      console.log('❌ 인증되지 않은 사용자');
      return null;
    }

    return await requestFn();
  } catch (error) {
    console.error('❌ 인증된 요청 실패:', error);
    return null;
  }
};
