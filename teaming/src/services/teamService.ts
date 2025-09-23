// teamService.ts
import apiClient from './api';

export interface CreateTeamRequest {
  title: string;
  description: string;
  memberCount: number;
  roomType: 'DEMO' | 'BASIC' | 'STANDARD' | 'ELITE';
  imageKey?: string;
  imageVersion?: number;
}

export interface CreateTeamResponse {
  inviteCode: string;
  roomId?: number;
  success?: boolean;
}

export interface RoomSearchResponse {
  title: string;
  imageKey: string;
  imageVersion: number;
  type: {
    typeName: string;
    price: number;
    description: string;
  };
  currentMemberCount: number;
  maxMemberCount: number;
}

/**
 * 팀 생성
 */
export const createTeam = async (
  teamData: CreateTeamRequest
): Promise<CreateTeamResponse> => {
  try {
    console.log('🚀 팀 생성 요청 중...', teamData);
    const response = await apiClient.post('/rooms', teamData);
    console.log('✅ 팀 생성 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 팀 생성 실패:', error);
    throw error;
  }
};

/**
 * 초대코드로 방 검색
 */
export const searchRoomByInviteCode = async (
  inviteCode: string
): Promise<RoomSearchResponse> => {
  try {
    console.log('🚀 방 검색 요청 중...', inviteCode);
    const response = await apiClient.get('/rooms/search', {
      params: { inviteCode },
    });
    console.log('✅ 방 검색 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 방 검색 실패:', error);
    throw error;
  }
};

/**
 * 팀 정보 가져오기
 */
export const getTeamInfo = async (roomId: number) => {
  try {
    console.log(`🚀 팀 ${roomId} 정보 요청 중...`);
    const response = await apiClient.get(`/rooms/${roomId}`);
    console.log('✅ 팀 정보 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ 팀 ${roomId} 정보 가져오기 실패:`, error);
    throw error;
  }
};
