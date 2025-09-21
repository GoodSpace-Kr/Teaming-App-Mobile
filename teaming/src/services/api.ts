import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  getAccessToken,
  refreshAccessToken,
  clearTokens,
} from './tokenManager';

// API 기본 설정
const API_BASE_URL = 'http://13.125.193.243:8080';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // 토큰이 필요한 API인지 확인 (로그인 관련 API 제외)
      const isAuthRequired =
        !config.url?.includes('/auth/') &&
        !config.url?.includes('/health') &&
        !config.url?.includes('/public/');

      if (isAuthRequired) {
        const token = await getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      // 요청 로깅
      console.log(
        `🚀 API 요청: ${config.method?.toUpperCase()} ${config.baseURL}${
          config.url
        }`
      );
      console.log('요청 데이터:', config.data);
      console.log('요청 헤더:', config.headers);
    } catch (error) {
      console.error('토큰 가져오기 실패:', error);
    }
    return config;
  },
  (error) => {
    console.error('요청 인터셉터 에러:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리 및 토큰 갱신
apiClient.interceptors.response.use(
  (response) => {
    // 성공 응답 로깅
    console.log(
      `✅ API 응답 성공: ${response.config.method?.toUpperCase()} ${
        response.config.url
      }`
    );
    console.log('응답 상태:', response.status);
    console.log('응답 데이터:', response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 에러 응답 로깅
    console.error(
      `❌ API 에러: ${error.config?.method?.toUpperCase()} ${error.config?.url}`
    );
    console.error('에러 상태:', error.response?.status);
    console.error('에러 데이터:', error.response?.data);
    console.error('에러 메시지:', error.message);

    // 401 에러 처리 (토큰 만료)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('🔄 토큰 만료 감지, 토큰 갱신 시도...');

      try {
        const refreshSuccess = await refreshAccessToken();

        if (refreshSuccess) {
          // 토큰 갱신 성공 시 원래 요청 재시도
          const newToken = await getAccessToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        } else {
          // 토큰 갱신 실패 시 로그아웃 처리
          console.log('❌ 토큰 갱신 실패, 로그아웃 처리');
          await clearTokens();
          // 로그인 화면으로 리다이렉트 (필요시)
        }
      } catch (refreshError) {
        console.error('❌ 토큰 갱신 중 에러:', refreshError);
        await clearTokens();
      }
    }

    return Promise.reject(error);
  }
);

// 서버 연결 테스트 함수
export const testServerConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 서버 연결 테스트 시작...');
    const response = await apiClient.get('/health');
    console.log('✅ 서버 연결 성공:', response.data);
    return true;
  } catch (error: any) {
    console.error('❌ 서버 연결 실패:', error);
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      console.error('네트워크 연결 문제 또는 서버가 응답하지 않음');
    } else {
      console.error(
        '서버 응답 에러:',
        error.response?.status,
        error.response?.data
      );
    }
    return false;
  }
};

export default apiClient;
