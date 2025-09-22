// naverAuth.ts
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import apiClient from './api';

// ✅ 프록시 세션 마무리 훅 (앱 시작 시 1회 호출)
WebBrowser.maybeCompleteAuthSession();

// ✅ 네이버 Client ID
const NAVER_CLIENT_ID = 'VYf9Phuf2zxzz4YhzLNl';

// ✅ 프록시 Redirect URI (명시적 설정)
const REDIRECT_URI = 'https://auth.expo.io/@staralstjr/teaming';
console.log('🔍 REDIRECT_URI =', REDIRECT_URI);

export interface NaverUser {
  id: string;
  nickname: string;
  name: string;
  email: string;
  gender: string;
  age: string;
  birthday: string;
  profile_image: string;
  birthyear: string;
  mobile: string;
}

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  error?: string;
}

/**
 * 네이버 로그인 (WebBrowser 방식 - Expo Go 호환)
 */
export const loginWithNaver = async (): Promise<AuthResult> => {
  try {
    console.log('🚀 네이버 로그인 시작 (WebBrowser 방식)');

    // 네이버 인증 URL 생성
    const authUrl = `https://nid.naver.com/oauth2.0/authorize?client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=code&state=${Math.random().toString(36).slice(2)}`;
    console.log('🔍 네이버 인증 URL:', authUrl);

    // WebBrowser로 네이버 로그인 실행
    const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
    console.log('📱 브라우저 세션 결과:', result);

    if (result.type !== 'success' || !result.url) {
      console.error('❌ 네이버 로그인 실패 또는 취소');
      return { success: false, error: '네이버 로그인이 취소되었습니다.' };
    }

    // URL에서 인증 코드 추출
    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    console.log('🔍 추출된 인증 코드:', code ? '있음' : '없음');
    console.log('🔍 에러:', error);
    console.log('🔍 에러 설명:', errorDescription);

    if (error) {
      console.error('❌ 네이버 OAuth 에러:', error, errorDescription);
      return {
        success: false,
        error: `${error}${errorDescription ? `: ${errorDescription}` : ''}`,
      };
    }

    if (!code) {
      console.error('❌ 인증 코드를 찾을 수 없음');
      return { success: false, error: '인증 코드를 받지 못했습니다.' };
    }

    // 서버로 인증 코드 전달하여 JWT 발급
    console.log('🚀 서버로 인증 코드 전송 중...');
    const { data } = await apiClient.post('/api/auth/app/naver', {
      code: code,
      redirectUri: REDIRECT_URI,
    });

    console.log('✅ 서버 응답 성공:', data);

    if (data?.accessToken) {
      return {
        success: true,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      };
    }

    return { success: false, error: data?.message || '로그인에 실패했습니다.' };
  } catch (error: any) {
    console.error('❌ 네이버 로그인 에러:', error);

    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return { success: false, error: '네트워크 연결을 확인해주세요.' };
    }

    if (error.response?.data?.message) {
      return { success: false, error: error.response.data.message };
    }

    return { success: false, error: '로그인 중 오류가 발생했습니다.' };
  }
};

/**
 * 네이버 사용자 정보 가져오기 (서버에서 처리)
 */
export const getNaverUserInfo = async (): Promise<any> => {
  try {
    // 서버에서 사용자 정보를 가져오는 API 호출
    const response = await apiClient.get('/api/user/profile');
    return response.data;
  } catch (error) {
    console.error('네이버 사용자 정보 가져오기 실패:', error);
    return null;
  }
};

/**
 * 네이버 로그아웃
 */
export const logoutNaver = async (): Promise<boolean> => {
  try {
    await apiClient.post('/auth/logout');
    return true;
  } catch (error) {
    console.error('네이버 로그아웃 실패:', error);
    return false;
  }
};
