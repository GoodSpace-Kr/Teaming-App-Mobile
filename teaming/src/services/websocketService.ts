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
    // 다양한 경로 시도: /ws/websocket, /ws, /websocket
    const brokerURL = `${scheme}://${host}/ws/websocket`;

    // JWT 토큰 디코딩해서 만료 시간 확인
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < now;

      console.log('🔌 웹소켓 연결 설정:', {
        brokerURL,
        jwtLength: jwt.length,
        jwtPrefix: jwt.substring(0, 20) + '...',
        useTLS,
        jwtPayload: {
          sub: payload.sub,
          exp: payload.exp,
          iat: payload.iat,
          isExpired,
          expiresIn: payload.exp - now,
        },
      });

      if (isExpired) {
        console.error('❌ JWT 토큰이 만료되었습니다!');
      }
    } catch (error) {
      console.error('❌ JWT 토큰 디코딩 실패:', error);
    }

    this.client = new Client({
      brokerURL,
      // 명세서에 따라 Authorization 헤더로 JWT 토큰 전송
      connectHeaders: {
        Authorization: `Bearer ${jwt}`,
      },
      debug: (str) => {
        console.log('[STOMP]', str);
        // STOMP 연결 과정을 더 자세히 로깅
        if (str.includes('CONNECTED')) {
          console.log('🎉 STOMP CONNECTED 명령 수신됨!');
        }
        if (str.includes('ERROR')) {
          console.log('❌ STOMP ERROR 명령 수신됨!');
        }
        if (str.includes('scheduling reconnection')) {
          console.log('🔄 STOMP 재연결 스케줄링 중...');
        }
        if (str.includes('Web Socket Closed')) {
          console.log('🔌 WebSocket 연결이 닫혔습니다.');
        }
        if (str.includes('Web Socket Error')) {
          console.log('❌ WebSocket 에러 발생!');
        }
      },
      reconnectDelay: 0, // 재연결 비활성화
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.onConnect = (frame) => {
      console.log('✅ 웹소켓 연결 성공:', {
        headers: frame.headers,
      });
      console.log('🔄 상태를 connected로 변경합니다.');
      this.setStatus('connected');
    };

    this.client.onStompError = (frame) => {
      console.error('❌ STOMP 에러 상세:', {
        command: frame.command,
        headers: frame.headers,
        body: frame.body,
        message: frame.headers['message'],
        receipt: frame.headers['receipt'],
      });
      this.setStatus('error');
    };

    this.client.onWebSocketError = (error) => {
      console.error('❌ 웹소켓 에러 상세:', {
        type: error.type,
        target: error.target?.url,
        message: error.message,
        code: error.code,
        reason: error.reason,
      });
      this.setStatus('error');
    };

    this.client.onDisconnect = (frame) => {
      console.log('🔌 웹소켓 연결 해제:', {
        command: frame.command,
        headers: frame.headers,
        body: frame.body,
      });
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
        console.log('🔄 이미 연결된 상태입니다.');
        resolve();
        return;
      }

      console.log('🚀 웹소켓 연결 시작...');
      this.setStatus('connecting');

      // STOMP 클라이언트는 이미 setupEventHandlers에서 이벤트 핸들러가 설정됨
      // 연결 성공/실패는 onConnect, onStompError, onWebSocketError에서 처리됨

      // 연결 성공을 감지하기 위한 임시 리스너
      const originalOnConnect = this.client.onConnect;
      const originalOnStompError = this.client.onStompError;
      const originalOnWebSocketError = this.client.onWebSocketError;

      this.client.onConnect = (frame: any) => {
        console.log('✅ 웹소켓 연결 완료 (Promise):', frame);
        // 원래 핸들러도 호출
        if (originalOnConnect) {
          originalOnConnect(frame);
        }
        resolve();
      };

      this.client.onStompError = (frame: any) => {
        console.error('❌ STOMP 연결 실패:', frame);
        // 원래 핸들러도 호출
        if (originalOnStompError) {
          originalOnStompError(frame);
        }
        reject(
          new Error(
            `STOMP Error: ${frame.headers['message'] || 'Unknown error'}`
          )
        );
      };

      this.client.onWebSocketError = (error: any) => {
        console.error('❌ 웹소켓 연결 실패:', {
          error,
          type: error?.type,
          message: error?.message,
          code: error?.code,
        });
        // 원래 핸들러도 호출
        if (originalOnWebSocketError) {
          originalOnWebSocketError(error);
        }
        reject(error);
      };

      try {
        console.log('🔄 STOMP 클라이언트 활성화 중...');
        this.client.activate();
      } catch (error) {
        console.error('❌ STOMP 클라이언트 활성화 실패:', error);
        reject(error);
      }
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
    console.log(`📡 채팅방 ${roomId} 구독 시작...`);

    // 채팅 메시지 구독
    const messageSub = this.client.subscribe(
      `/topic/rooms/${roomId}`,
      (frame: IMessage) => {
        try {
          console.log(`📨 채팅방 ${roomId} 메시지 수신:`, frame.body);
          const message: ChatMessage = JSON.parse(frame.body);
          handlers.onMessage?.(message);
        } catch (error) {
          console.error('메시지 파싱 에러:', error, '원본 데이터:', frame.body);
        }
      }
    );
    this.subscriptions.push(messageSub);
    console.log(`✅ 채팅 메시지 구독 완료: /topic/rooms/${roomId}`);

    // 읽음 경계 업데이트 구독
    const readSub = this.client.subscribe(
      `/topic/rooms/${roomId}/read`,
      (frame: IMessage) => {
        try {
          console.log(`📖 채팅방 ${roomId} 읽음 경계 업데이트:`, frame.body);
          const update: ReadBoundaryUpdate = JSON.parse(frame.body);
          handlers.onReadBoundary?.(update);
        } catch (error) {
          console.error(
            '읽음 경계 파싱 에러:',
            error,
            '원본 데이터:',
            frame.body
          );
        }
      }
    );
    this.subscriptions.push(readSub);
    console.log(`✅ 읽음 경계 구독 완료: /topic/rooms/${roomId}/read`);
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

    console.log(`📤 채팅방 ${roomId}에 메시지 전송:`, {
      destination: `/app/rooms/${roomId}/send`,
      message,
      roomId,
    });

    try {
      this.client.publish({
        destination: `/app/rooms/${roomId}/send`,
        body: JSON.stringify(message),
        headers: { 'content-type': 'application/json' },
      });
      console.log('✅ 메시지 전송 성공');
    } catch (error) {
      console.error('❌ 메시지 전송 실패:', error);
    }
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
