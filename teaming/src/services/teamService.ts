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

    // roomId 로깅
    if (response.data.roomId) {
      console.log('🏠 생성된 방 ID:', response.data.roomId);
    } else {
      console.log('⚠️ 응답에 roomId가 없습니다');
    }

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

// 초대코드로 팀 참여 API
export interface JoinTeamRequest {
  inviteCode: string;
}

export interface JoinTeamResponse {
  roomId: number;
  role: 'LEADER' | 'MEMBER';
  unreadCount: number;
  lastMessage: {
    id: number;
    type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
    content: string;
    sender: {
      id: number;
      name: string;
      avatarUrl: string;
      avatarVersion: number;
    };
    createdAt: string;
  } | null;
  title: string;
  imageKey: string;
  imageVersion: number;
  type: 'DEMO' | 'BASIC' | 'STANDARD' | 'ELITE';
  memberCount: number;
  success: boolean;
  members: Array<{
    memberId: number;
    lastReadMessageId: number;
    name: string;
    avatarKey: string;
    avatarVersion: number;
    roomRole: 'LEADER' | 'MEMBER';
  }>;
}

export const joinTeamByInviteCode = async (
  data: JoinTeamRequest
): Promise<JoinTeamResponse> => {
  try {
    console.log('🚀 초대코드로 팀 참여 요청:', data);
    const response = await apiClient.post('/rooms/invite', data);
    console.log('✅ 팀 참여 성공:', response.data);
    console.log('🏠 참여한 방 ID:', response.data.roomId);
    console.log('👤 사용자 역할:', response.data.role);
    return response.data;
  } catch (error) {
    console.error('❌ 팀 참여 실패:', error);
    throw error;
  }
};
