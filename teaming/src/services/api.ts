import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  getAccessToken,
  refreshAccessToken,
  clearTokens,
} from './tokenManager';

// API 기본 설정
const API_BASE_URL = 'https://teamingkr.duckdns.org/api';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
        !config.url?.includes('/public/') &&
        !config.url?.includes('/landing');

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

      // 구글 로그인 API 특별 로깅
      if (
        config.url?.includes('/api/auth/app/google') ||
        config.url?.includes('/api/auth/web/google')
      ) {
        console.log('🔵 구글 로그인 API 요청');
        console.log('📤 전송 데이터:', JSON.stringify(config.data, null, 2));
      }
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

    // 구글 로그인 API 특별 로깅
    if (
      response.config.url?.includes('/api/auth/app/google') ||
      response.config.url?.includes('/api/auth/web/google')
    ) {
      console.log('🔵 구글 로그인 API 응답');
      console.log('📥 응답 상태:', response.status);
      console.log('📥 받은 데이터:', JSON.stringify(response.data, null, 2));
    }

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

    // 구글 로그인 API 에러 특별 로깅
    if (
      error.config?.url?.includes('/api/auth/app/google') ||
      error.config?.url?.includes('/api/auth/web/google')
    ) {
      console.error('🔴 구글 로그인 API 에러');
      console.error('📥 에러 상태:', error.response?.status);
      console.error(
        '📥 에러 데이터:',
        JSON.stringify(error.response?.data, null, 2)
      );
    }

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

// 회원가입 API
export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  avatarKey: string;
  avatarVersion: number;
}

export interface SignUpResponse {
  accessToken: string;
  refreshToken: string;
}

export const signUp = async (data: SignUpRequest): Promise<SignUpResponse> => {
  try {
    console.log('🚀 회원가입 API 요청:', data);
    const response = await apiClient.post<SignUpResponse>(
      '/api/auth/teaming/sign-up',
      data
    );
    console.log('✅ 회원가입 성공:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ 회원가입 실패:', error);
    throw error;
  }
};

// 로그인 API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    console.log('🚀 로그인 API 요청:', data);
    const response = await apiClient.post<LoginResponse>(
      '/api/auth/teaming/sign-in',
      data
    );
    console.log('✅ 로그인 성공:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ 로그인 실패:', error);
    throw error;
  }
};

// 이메일 수정 API
export interface UpdateEmailRequest {
  email: string;
}

export const updateEmail = async (data: UpdateEmailRequest): Promise<void> => {
  try {
    console.log('🚀 이메일 수정 API 요청:', data);
    const response = await apiClient.patch('/users/me/email', data);
    console.log('✅ 이메일 수정 성공:', response.data);
  } catch (error: any) {
    console.error('❌ 이메일 수정 실패:', error);
    throw error;
  }
};

// 사용자 정보 조회 API
export interface UserInfo {
  email: string;
  name: string;
  avatarKey: string;
  avatarVersion: number;
}

export const getUserInfo = async (): Promise<UserInfo> => {
  try {
    console.log('🚀 사용자 정보 조회 API 요청');
    const response = await apiClient.get<UserInfo>('/users/me');
    console.log('✅ 사용자 정보 조회 성공:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ 사용자 정보 조회 실패:', error);
    throw error;
  }
};

// 닉네임 변경 API
export interface UpdateNameRequest {
  name: string;
}

export const updateName = async (data: UpdateNameRequest): Promise<void> => {
  try {
    console.log('🚀 닉네임 변경 API 요청:', data);
    const response = await apiClient.patch('/users/me/name', data);
    console.log('✅ 닉네임 변경 성공:', response.data);
  } catch (error: any) {
    console.error('❌ 닉네임 변경 실패:', error);
    throw error;
  }
};

// 비밀번호 변경 API
export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const updatePassword = async (
  data: UpdatePasswordRequest
): Promise<void> => {
  try {
    console.log('🚀 비밀번호 변경 API 요청');
    console.log('📤 요청 데이터:', {
      currentPassword: data.currentPassword ? '***' : 'undefined',
      newPassword: data.newPassword ? '***' : 'undefined',
    });
    const response = await apiClient.patch('/users/me/password', data);
    console.log('✅ 비밀번호 변경 성공:', response.data);
    console.log('📥 응답 상태:', response.status);
  } catch (error: any) {
    console.error('❌ 비밀번호 변경 실패:', error);
    console.error('📥 에러 상태:', error.response?.status);
    console.error('📥 에러 데이터:', error.response?.data);
    throw error;
  }
};

// 결제 API
export const createPayment = async (amount: number): Promise<string> => {
  try {
    console.log('🚀 결제 API 요청 - amount:', amount);
    const response = await apiClient.get<string>('/payment/html', {
      params: { amount },
    });
    console.log('✅ 결제 API 성공:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ 결제 API 실패:', error);
    throw error;
  }
};

// 팀플 완료 API
export const completeTeamProject = async (roomId: number): Promise<void> => {
  try {
    console.log('🚀 팀플 완료 API 요청 - roomId:', roomId);
    const response = await apiClient.patch(`/rooms/${roomId}/success`);
    console.log('✅ 팀플 완료 성공:', response.data);
  } catch (error: any) {
    console.error('❌ 팀플 완료 실패:', error);
    throw error;
  }
};

export default apiClient;
