import apiClient from './api';

// Landing API 응답 타입 정의
export interface LandingStats {
  totalUserCount: number;
  totalTeamCount: number;
  completeTeamCount: number;
}

// Landing 통계 조회 API
export const getLandingStats = async (): Promise<LandingStats> => {
  try {
    const response = await apiClient.get('/landing');
    return response.data;
  } catch (error) {
    console.error('Landing 통계 조회 실패:', error);
    throw error;
  }
};
