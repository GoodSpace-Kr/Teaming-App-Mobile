// websocketService.ts
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { nanoid } from 'nanoid/non-secure';

// 웹소켓 메시지 타입 정의 (명세서 기반)
export interface ChatSendRequest {
  clientMessageId: string;
  content: string | null;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO' | 'SYSTEM_NOTICE';
  attachmentFileIdsInOrder?: number[];
}

export interface ChatMessage {
  messageId: number;
  roomId: number;
  clientMessageId: string;
  type: ChatSendRequest['type'];
  content: string | null;
  createdAt: string;
  sender: {
    id: number | null;
    name: string;
    avatarUrl: string | null;
  };
  attachments: MessageAttachment[];
}

export interface MessageAttachment {
  fileId: number;
  sortOrder: number;
  name: string;
  type: 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO';
  mimeType: string;
  byteSize: number;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  previewUrl?: string | null;
  thumbnailUrl?: string | null;
  downloadUrl?: string | null;
  antiVirusScanStatus: 'PENDING' | 'PASSED' | 'FAILED' | 'INFECTED';
  transcodeStatus: 'NONE' | 'PENDING' | 'COMPLETED' | 'FAILED';
  ready: boolean;
}

export interface ReadBoundaryUpdate {
  roomId?: number;
  userId: number;
  lastReadMessageId: number | null;
  unreadCount: number;
}

export interface UserError {
  message: string;
}

export interface UserRoomEvent {
  roomId: number;
  unreadCount: number;
  lastMessage?: {
    id: number;
    type: ChatSendRequest['type'];
    content: string | null;
    sender: {
      id: number | null;
      name: string;
      avatarUrl: string | null;
    };
    createdAt: string;
  } | null;
}

// 웹소켓 연결 상태
export type WebSocketStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

// 웹소켓 클라이언트 클래스
export class WebSocketService {
  private client: Client;
  private subscriptions: StompSubscription[] = [];
  private status: WebSocketStatus = 'disconnected';
  private statusListeners: ((status: WebSocketStatus) => void)[] = [];
  private jwt: string;

  constructor(
    jwt: string,
    host: string = '13.125.193.243:8080',
    useTLS: boolean = false
  ) {
    this.jwt = jwt;
    const scheme = useTLS ? 'wss' : 'ws';
    // Spring SockJS + STOMP 환경에서 순수 WebSocket 경로
    const brokerURL = `${scheme}://${host}/ws/websocket`;

    this.client = new Client({
      brokerURL,
      connectHeaders: {
        Authorization: `Bearer ${jwt}`,
      },
      debug: (str) => console.log('[STOMP]', str),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.onConnect = () => {
      console.log('✅ 웹소켓 연결 성공');
      this.setStatus('connected');
    };

    this.client.onStompError = (frame) => {
      console.error('❌ STOMP 에러:', frame.headers['message'], frame.body);
      this.setStatus('error');
    };

    this.client.onWebSocketError = (error) => {
      console.error('❌ 웹소켓 에러:', error);
      this.setStatus('error');
    };

    this.client.onDisconnect = () => {
      console.log('🔌 웹소켓 연결 해제');
      this.setStatus('disconnected');
    };
  }

  private setStatus(status: WebSocketStatus) {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  // 상태 변경 리스너 등록
  onStatusChange(listener: (status: WebSocketStatus) => void) {
    this.statusListeners.push(listener);
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  // 현재 상태 반환
  getStatus(): WebSocketStatus {
    return this.status;
  }

  // 연결 시작
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.status === 'connected') {
        resolve();
        return;
      }

      this.setStatus('connecting');

      const onConnect = () => {
        this.client.off('connect', onConnect);
        this.client.off('error', onError);
        resolve();
      };

      const onError = (error: any) => {
        this.client.off('connect', onConnect);
        this.client.off('error', onError);
        reject(error);
      };

      this.client.on('connect', onConnect);
      this.client.on('error', onError);

      this.client.activate();
    });
  }

  // 연결 해제
  disconnect() {
    try {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions = [];
      this.client.deactivate();
    } catch (error) {
      console.error('연결 해제 중 에러:', error);
    }
  }

  // 채팅방 구독
  subscribeToRoom(
    roomId: number,
    handlers: {
      onMessage?: (message: ChatMessage) => void;
      onReadBoundary?: (update: ReadBoundaryUpdate) => void;
    }
  ) {
    // 채팅 메시지 구독
    const messageSub = this.client.subscribe(
      `/topic/rooms/${roomId}`,
      (frame: IMessage) => {
        try {
          const message: ChatMessage = JSON.parse(frame.body);
          handlers.onMessage?.(message);
        } catch (error) {
          console.error('메시지 파싱 에러:', error);
        }
      }
    );
    this.subscriptions.push(messageSub);

    // 읽음 경계 업데이트 구독
    const readSub = this.client.subscribe(
      `/topic/rooms/${roomId}/read`,
      (frame: IMessage) => {
        try {
          const update: ReadBoundaryUpdate = JSON.parse(frame.body);
          handlers.onReadBoundary?.(update);
        } catch (error) {
          console.error('읽음 경계 파싱 에러:', error);
        }
      }
    );
    this.subscriptions.push(readSub);
  }

  // 개인 큐 구독
  subscribeToUserQueues(handlers: {
    onUserError?: (error: UserError) => void;
    onUserRoomEvent?: (event: UserRoomEvent) => void;
  }) {
    // 에러 큐 구독
    const errorSub = this.client.subscribe(
      '/user/queue/errors',
      (frame: IMessage) => {
        try {
          const error: UserError = JSON.parse(frame.body);
          handlers.onUserError?.(error);
        } catch (error) {
          console.error('에러 메시지 파싱 에러:', error);
        }
      }
    );
    this.subscriptions.push(errorSub);

    // 방 이벤트 큐 구독
    const eventSub = this.client.subscribe(
      '/user/queue/room-events',
      (frame: IMessage) => {
        try {
          const event: UserRoomEvent = JSON.parse(frame.body);
          handlers.onUserRoomEvent?.(event);
        } catch (error) {
          console.error('방 이벤트 파싱 에러:', error);
        }
      }
    );
    this.subscriptions.push(eventSub);
  }

  // 채팅 메시지 전송
  sendChatMessage(
    roomId: number,
    payload: Omit<ChatSendRequest, 'clientMessageId'>
  ) {
    const message: ChatSendRequest = {
      ...payload,
      clientMessageId: nanoid(),
    };

    this.client.publish({
      destination: `/app/rooms/${roomId}/send`,
      body: JSON.stringify(message),
      headers: { 'content-type': 'application/json' },
    });

    console.log('📤 메시지 전송:', message);
  }

  // 텍스트 메시지 전송 (편의 메서드)
  sendTextMessage(roomId: number, content: string) {
    this.sendChatMessage(roomId, {
      type: 'TEXT',
      content,
      attachmentFileIdsInOrder: [],
    });
  }

  // 이미지 메시지 전송 (편의 메서드)
  sendImageMessage(
    roomId: number,
    content: string | null,
    attachmentFileIds: number[]
  ) {
    this.sendChatMessage(roomId, {
      type: 'IMAGE',
      content,
      attachmentFileIdsInOrder: attachmentFileIds,
    });
  }

  // 파일 메시지 전송 (편의 메서드)
  sendFileMessage(
    roomId: number,
    content: string | null,
    attachmentFileIds: number[]
  ) {
    this.sendChatMessage(roomId, {
      type: 'FILE',
      content,
      attachmentFileIdsInOrder: attachmentFileIds,
    });
  }
}

// 싱글톤 인스턴스 관리
let wsInstance: WebSocketService | null = null;

export const getWebSocketService = (jwt?: string): WebSocketService | null => {
  if (!jwt && !wsInstance) {
    console.warn('JWT 토큰이 없어 웹소켓 서비스를 생성할 수 없습니다.');
    return null;
  }

  if (jwt && (!wsInstance || wsInstance['jwt'] !== jwt)) {
    // 기존 인스턴스가 있으면 연결 해제
    if (wsInstance) {
      wsInstance.disconnect();
    }
    wsInstance = new WebSocketService(jwt);
  }

  return wsInstance;
};

export const disconnectWebSocket = () => {
  if (wsInstance) {
    wsInstance.disconnect();
    wsInstance = null;
  }
};
