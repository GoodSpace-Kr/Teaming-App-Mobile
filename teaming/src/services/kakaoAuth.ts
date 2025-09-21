// kakaoAuth.ts
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import apiClient from './api';

// ✅ 프록시 세션 마무리 훅 (앱 시작 시 1회 호출)
WebBrowser.maybeCompleteAuthSession();

// ✅ Kakao REST API Key
const KAKAO_REST_API_KEY = 'bab0d232a194e56bd4920ba68c04e3e6';

// ✅ 프록시 Redirect URI (명시적 설정)
const REDIRECT_URI = 'https://auth.expo.io/@staralstjr/teaming';
console.log('🔍 REDIRECT_URI =', REDIRECT_URI);

export interface KakaoUser {
  id: number;
  connected_at: string;
  properties: {
    nickname: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account: {
    profile: {
      nickname: string;
      profile_image_url?: string;
      thumbnail_image_url?: string;
    };
    email?: string;
    gender?: string;
    age_range?: string;
    birthday?: string;
  };
}

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  error?: string;
}

/**
 * 카카오 로그인 (WebBrowser 방식 - Expo Go 호환)
 */
export const loginWithKakao = async (): Promise<AuthResult> => {
  try {
    console.log('🚀 카카오 로그인 시작 (WebBrowser 방식)');

    // 카카오 인증 URL 생성
    const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=code`;
    console.log('🔍 카카오 인증 URL:', authUrl);

    // WebBrowser로 카카오 로그인 실행
    const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
    console.log('📱 브라우저 세션 결과:', result);

    if (result.type !== 'success' || !result.url) {
      console.error('❌ 카카오 로그인 실패 또는 취소');
      return { success: false, error: '카카오 로그인이 취소되었습니다.' };
    }

    // URL에서 인증 코드 추출
    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    console.log('🔍 추출된 인증 코드:', code ? '있음' : '없음');

    if (!code) {
      console.error('❌ 인증 코드를 찾을 수 없음');
      return { success: false, error: '인증 코드를 받지 못했습니다.' };
    }

    // 서버로 인증 코드 전달하여 JWT 발급
    console.log('🚀 서버로 인증 코드 전송 중...');
    const { data } = await apiClient.post('/api/auth/app/kakao', {
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
    console.error('❌ 카카오 로그인 에러:', error);

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
 * 카카오 사용자 정보 가져오기 (서버에서 처리)
 */
export const getKakaoUserInfo = async (): Promise<any> => {
  try {
    // 서버에서 사용자 정보를 가져오는 API 호출
    const response = await apiClient.get('/api/user/profile');
    return response.data;
  } catch (error) {
    console.error('카카오 사용자 정보 가져오기 실패:', error);
    return null;
  }
};

/**
 * 카카오 로그아웃
 */
export const logoutKakao = async (): Promise<boolean> => {
  try {
    await apiClient.post('/auth/logout');
    return true;
  } catch (error) {
    console.error('카카오 로그아웃 실패:', error);
    return false;
  }
};
