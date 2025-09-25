// React Native STOMP over SockJS client for Teaming
// 서버(Spring) 설정 매칭:
//  - SockJS 엔드포인트: https://teamingkr.duckdns.org/api/ws-sockjs
//  - SUBSCRIBE: /topic/rooms/{roomId}
//  - SEND     : /app/rooms/{roomId}/send
//  - CONNECT/SUBSCRIBE/SEND 모두 Authorization 포함

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
// @ts-ignore - sockjs-client 타입 정의 없음
import SockJS from 'sockjs-client/dist/sockjs'; // RN 호환 번들
import {
  getAccessToken,
  refreshAccessToken,
} from '@/src/services/tokenManager';

// ====== 고정값 ======
const HTTP_BASE = 'https://teamingkr.duckdns.org/api'; // 필요시 https로 교체
const SOCKJS_ENDPOINT = `${HTTP_BASE.replace(/\/+$/, '')}/ws-sockjs`;
const SUB_PREFIX = '/topic/rooms/';
const SEND_PREFIX = '/app/rooms/';

// ====== 타입 ======
export type ChatMessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'FILE'
  | 'VIDEO'
  | 'AUDIO'
  | 'SYSTEM_NOTICE';
export interface ChatSender {
  id?: number;
  name?: string;
  avatarUrl?: string;
}
export interface ChatMessage {
  messageId?: number;
  roomId?: number;
  clientMessageId?: string;
  type?: ChatMessageType;
  content?: string;
  createdAt?: string;
  sender?: ChatSender;
  attachments?: any[];
  [k: string]: any;
}

// ====== 내부 상태 ======
let client: Client | null = null;
let currentToken: string | null = null;
let connected = false;
let triedRefreshOnClose = false;
let subs: Record<string, StompSubscription> = {};

// ====== 유틸 ======
const ensureClient = () => {
  if (!client)
    throw new Error('WS client not initialized. Call connectSock() first.');
  return client!;
};
const authHeaders = (): Record<string, string> => {
  const v = currentToken ? `Bearer ${currentToken}` : '';
  return v ? { Authorization: v, authorization: v } : {};
};

// ====== 연결 ======
export async function connectSock(token?: string) {
  if (connected && client?.active) return;

  currentToken = token ?? (await getAccessToken());
  if (!currentToken) throw new Error('No access token');

  if (client) {
    try {
      await client.deactivate();
    } catch {}
    client = null;
  }
  subs = {};
  triedRefreshOnClose = false;

  // RN에서도 사용 가능한 SockJS 인스턴스 생성
  const socketFactory = () =>
    // transports 지정: 우선순위를 websocket->xhr-streaming->xhr-polling으로
    new SockJS(SOCKJS_ENDPOINT, null, {
      transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
    });

  client = new Client({
    // ✅ SockJS를 STOMP 클라이언트의 소켓으로 사용
    webSocketFactory: socketFactory as any,

    // ✅ CONNECT 헤더에 토큰(대/소문자 둘 다) + host
    connectHeaders: {
      host: 'teamingkr.duckdns.org',
      'accept-version': '1.2,1.1,1.0',
      ...authHeaders(),
    } as any,

    // 하트비트 활성화로 연결 안정성 향상
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    reconnectDelay: 5000, // 재연결 지연 시간 증가

    debug: (msg) => console.log('[STOMP/SockJS]', msg),

    beforeConnect: () => {
      console.log('[STOMP/SockJS] connecting...');
    },

    onConnect: (frame) => {
      connected = true;
      triedRefreshOnClose = false; // 연결 성공 시 재시도 플래그 리셋
      console.log('[STOMP/SockJS] CONNECTED:', frame.headers);
    },

    onStompError: (frame) => {
      console.warn(
        '[STOMP/SockJS] STOMP ERROR:',
        frame.headers?.message,
        frame.body
      );
    },

    onWebSocketError: (e) => {
      console.warn('[STOMP/SockJS] WS ERROR:', e);
    },

    onWebSocketClose: async (evt) => {
      connected = false;
      console.warn(
        '[STOMP/SockJS] WS CLOSED:',
        evt?.code,
        evt?.reason || '(no reason)'
      );

      // 최초 1회 토큰 갱신 후 재연결 시도
      if (!triedRefreshOnClose) {
        triedRefreshOnClose = true;
        try {
          const ok = await refreshAccessToken();
          if (ok) {
            currentToken = await getAccessToken();
            const c = ensureClient();
            c.connectHeaders = {
              ...(c.connectHeaders || {}),
              ...authHeaders(),
            } as any;
            c.activate();
            return;
          }
        } catch {}
      }
      // 이후는 reconnectDelay에 따라 자동 재시도
    },
  });

  client.activate();
}

export async function disconnectSock() {
  const c = ensureClient();
  try {
    Object.values(subs).forEach((s) => s.unsubscribe());
    subs = {};
  } catch {}
  connected = false;
  await c.deactivate();
}

export async function updateSockToken(nextToken?: string, reconnect = false) {
  currentToken = nextToken ?? (await getAccessToken());
  const c = ensureClient();
  c.connectHeaders = { ...(c.connectHeaders || {}), ...authHeaders() } as any;
  if (reconnect) {
    await disconnectSock();
    await connectSock(currentToken || undefined);
  }
}

// ====== 구독/발행 ======
export function subscribeRoomSock(
  roomId: number,
  onMessage: (m: ChatMessage, raw: IMessage) => void
): () => void {
  const c = ensureClient();
  if (!c.connected) {
    console.warn('[STOMP/SockJS] Not connected yet, waiting for connection...');
    // 연결 대기 후 재시도
    const retrySubscribe = (): (() => void) => {
      if (c.connected) {
        return subscribeRoomSock(roomId, onMessage);
      } else {
        setTimeout(() => retrySubscribe(), 1000);
        return () => {}; // 임시 unsubscribe 함수
      }
    };
    return retrySubscribe();
  }

  // 중복 제거
  if (subs[String(roomId)]) {
    subs[String(roomId)].unsubscribe();
    delete subs[String(roomId)];
  }

  const destination = `${SUB_PREFIX}${roomId}`;
  console.log('[STOMP/SockJS] 구독 시작:', destination);

  const sub = c.subscribe(
    destination,
    (msg) => {
      try {
        console.log('[STOMP/SockJS] 메시지 수신:', msg.body);
        onMessage(JSON.parse(msg.body) as ChatMessage, msg);
      } catch (error) {
        console.warn('[STOMP/SockJS] 메시지 파싱 실패:', error);
        onMessage(
          {
            messageId: Date.now(),
            roomId,
            type: 'SYSTEM_NOTICE',
            content: msg.body,
            createdAt: new Date().toISOString(),
            sender: { name: 'SYSTEM' },
          },
          msg
        );
      }
    },
    {
      // ✅ SUBSCRIBE 프레임에도 토큰 주입
      ...authHeaders(),
    } as any
  );

  subs[String(roomId)] = sub;
  console.log('[STOMP/SockJS] 구독 완료:', destination);

  return () => {
    try {
      sub.unsubscribe();
      console.log('[STOMP/SockJS] 구독 해제:', destination);
    } catch {}
    delete subs[String(roomId)];
  };
}

export function sendTextSock(roomId: number, content: string) {
  const c = ensureClient();
  if (!c.connected) throw new Error('Not connected');

  c.publish({
    destination: `${SEND_PREFIX}${roomId}/send`,
    headers: { ...authHeaders(), 'content-type': 'application/json' } as any,
    body: JSON.stringify({
      type: 'TEXT',
      content,
      clientMessageId: `client_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    }),
  });
}

export function sendImageSock(
  roomId: number,
  fileName: string,
  fileIds: number[]
) {
  const c = ensureClient();
  if (!c.connected) throw new Error('Not connected');

  c.publish({
    destination: `${SEND_PREFIX}${roomId}/send`,
    headers: { ...authHeaders(), 'content-type': 'application/json' } as any,
    body: JSON.stringify({
      type: 'IMAGE',
      name: fileName,
      attachmentFileIdsInOrder: fileIds,
      clientMessageId: `client_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    }),
  });
}

export function sendFileSock(
  roomId: number,
  fileName: string,
  fileIds: number[]
) {
  const c = ensureClient();
  if (!c.connected) throw new Error('Not connected');

  c.publish({
    destination: `${SEND_PREFIX}${roomId}/send`,
    headers: { ...authHeaders(), 'content-type': 'application/json' } as any,
    body: JSON.stringify({
      type: 'FILE',
      name: fileName,
      attachmentFileIdsInOrder: fileIds,
      clientMessageId: `client_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    }),
  });
}

// ====== 편의 헬퍼 ======
export async function connectAndSubscribeSock(
  roomId: number,
  onMessage: (m: ChatMessage, raw: IMessage) => void,
  token?: string
): Promise<() => void> {
  await connectSock(token);

  // stompjs의 activate는 비동기라 연결완료 보장
  await new Promise<void>((resolve, reject) => {
    const c = ensureClient();

    const ok = () => {
      resolve();
    };
    const fail = (e: any) => {
      reject(e);
    };

    c.onConnect = () => ok();
    c.onWebSocketError = fail;

    if (c.connected) ok();
  });

  return subscribeRoomSock(roomId, onMessage);
}
