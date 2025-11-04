// chatService.ts
import apiClient from './api';

export interface ChatMember {
  memberId: number;
  lastReadMessageId: number;
  name: string;
  avatarUrl: string;
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
  type: 'TEXT' | 'IMAGE' | 'FILE';
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
  avatarUrl: string;
  avatarVersion: number;
  type: {
    typeName: string;
    price: number;
    description: string;
  };
  memberCount: number;
  paymentStatus: 'NOT_PAID' | 'PAID' | 'REFUNDED';
  success: boolean;
  members: ChatMember[];
  ready: {
    everyMemberEntered: boolean;
  };
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
