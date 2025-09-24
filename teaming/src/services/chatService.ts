// chatService.ts
import apiClient from './api';

export interface ChatMember {
  memberId: number;
  lastReadMessageId: number;
  name: string;
  avatarKey: string;
  avatarVersion: number;
  roomRole: 'LEADER' | 'MEMBER';
}

export interface ChatSender {
  id: number;
  name: string;
  avatarUrl: string;
  avatarVersion: number;
}

export interface LastMessage {
  id: number;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  content: string;
  sender: ChatSender;
  createdAt: string;
}

export interface ChatRoom {
  roomId: number;
  role: 'LEADER' | 'MEMBER'; // 사용자의 해당 방에서의 역할
  unreadCount: number;
  lastMessage: LastMessage | null;
  title: string;
  imageKey: string;
  imageVersion: number;
  type: 'DEMO' | 'BASIC' | 'STANDARD' | 'ELITE'; // 방 타입
  memberCount: number;
  success: boolean;
  members: ChatMember[];
}

/**
 * 채팅방 목록 가져오기
 */
export const getChatRooms = async (): Promise<ChatRoom[]> => {
  try {
    console.log('🚀 채팅방 목록 요청 중...');
    const response = await apiClient.get('/rooms');
    console.log('✅ 채팅방 목록 응답:', response.data);

    // 각 방의 role 정보 로깅
    if (Array.isArray(response.data)) {
      response.data.forEach((room: ChatRoom) => {
        console.log(
          `🏠 방 ${room.roomId} (${room.title}): 역할 = ${room.role}`
        );
      });
    }

    return response.data;
  } catch (error) {
    console.error('❌ 채팅방 목록 가져오기 실패:', error);
    throw error;
  }
};

/**
 * 특정 채팅방 정보 가져오기
 */
export const getChatRoom = async (roomId: number): Promise<ChatRoom> => {
  try {
    console.log(`🚀 채팅방 ${roomId} 정보 요청 중...`);
    const response = await apiClient.get(`/rooms/${roomId}`);
    console.log('✅ 채팅방 정보 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ 채팅방 ${roomId} 정보 가져오기 실패:`, error);
    throw error;
  }
};
