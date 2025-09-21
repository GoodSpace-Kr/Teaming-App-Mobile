import apiClient from './api';

export interface EmailSendCodeRequest {
  email: string;
  shouldAlreadyExists: boolean;
}

export interface EmailVerifyCodeRequest {
  email: string;
  code: string;
}

export interface EmailAuthResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 이메일 인증 코드 전송
 */
export const sendEmailCode = async (
  email: string,
  shouldAlreadyExists: boolean = false
): Promise<EmailAuthResult> => {
  try {
    console.log('이메일 인증 코드 전송:', email, shouldAlreadyExists);

    const response = await apiClient.post('/email/send-code', {
      email: email,
      shouldAlreadyExists: shouldAlreadyExists,
    });

    console.log('이메일 인증 코드 전송 응답:', response.data);

    return {
      success: true,
      message: '인증 코드가 전송되었습니다.',
    };
  } catch (error: any) {
    console.error('이메일 인증 코드 전송 실패:', error);

    // 네트워크 에러 처리
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return {
        success: false,
        error: '네트워크 연결을 확인해주세요.',
      };
    }

    // 백엔드 에러 처리
    if (error.response?.data?.message) {
      return {
        success: false,
        error: error.response.data.message,
      };
    }

    return {
      success: false,
      error: '인증 코드 전송 중 오류가 발생했습니다.',
    };
  }
};

/**
 * 이메일 인증 코드 확인
 */
export const verifyEmailCode = async (
  email: string,
  code: string
): Promise<EmailAuthResult> => {
  try {
    console.log('이메일 인증 코드 확인:', email, code);

    const response = await apiClient.post('/email/verify-code', {
      email: email,
      code: code,
    });

    console.log('이메일 인증 코드 확인 응답:', response.data);

    return {
      success: true,
      message: '이메일 인증이 완료되었습니다.',
    };
  } catch (error: any) {
    console.error('이메일 인증 코드 확인 실패:', error);

    // 네트워크 에러 처리
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return {
        success: false,
        error: '네트워크 연결을 확인해주세요.',
      };
    }

    // 백엔드 에러 처리
    if (error.response?.data?.message) {
      return {
        success: false,
        error: error.response.data.message,
      };
    }

    return {
      success: false,
      error: '인증 코드 확인 중 오류가 발생했습니다.',
    };
  }
};
