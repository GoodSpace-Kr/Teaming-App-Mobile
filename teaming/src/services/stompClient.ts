// /src/services/stompClient.ts
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
// @ts-ignore
import SockJS from 'sockjs-client/dist/sockjs';
import {
  getAccessToken,
  refreshAccessToken,
} from '@/src/services/tokenManager';

// ====== 고정값 ======
const ORIGIN_BASE = 'https://teamingkr.duckdns.org';
const SOCKJS_ENDPOINT = `${ORIGIN_BASE}/api/ws-sockjs`; // 서버 엔드포인트와 동일

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
  avatarVersion?: number;
}
export interface ChatMessage {
  messageId?: number;
  roomId?: number;
  clientMessageId?: string;
  type?: ChatMessageType;
  content?: string | null;
  createdAt?: string;
  sender?: ChatSender;
  attachments?: any[];
  [k: string]: any;
}
export interface ReadBoundaryUpdate {
  roomId?: number;
  userId: number;
  lastReadMessageId?: number | null;
  unreadCount: number;
}

// ====== 내부 상태 ======
let client: Client | null = null;
let currentToken: string | null = null;
let subs: Record<string, StompSubscription> = {};
let triedRefreshOnClose = false;
let isActive = false;
let connectingPromise: Promise<void> | null = null;

// ====== 유틸 ======
const authHeaders = (): Record<string, string> =>
  currentToken ? { Authorization: `Bearer ${currentToken}` } : {};

const ensureClient = () => {
  if (!client)
    throw new Error('WS client not initialized. Call connectSock() first.');
  return client!;
};

// SockJS 세션 캐시 회피용
const makeSessionId = () =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

// 쿼리 토큰 포함 URL
const sockUrlWithToken = (token: string) =>
  `${SOCKJS_ENDPOINT}?token=${encodeURIComponent(token)}`;

// ====== 연결 ======
export async function connectSock(token?: string) {
  if (connectingPromise) return connectingPromise;

  connectingPromise = (async () => {
    try {
      currentToken = token ?? (await getAccessToken());
      if (!currentToken) {
        console.warn('[STOMP] No access token available');
        return;
      }
    } catch (e) {
      console.warn('[STOMP] Token fetch failed:', e);
      return;
    }

    // 기존 클라 정리
    if (client) {
      try {
        await client.deactivate();
      } catch {}
      client = null;
    }
    subs = {};
    triedRefreshOnClose = false;
    isActive = false;

    const socketFactory = () =>
      new SockJS(sockUrlWithToken(currentToken!), null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
        sessionId: makeSessionId,
      });

    client = new Client({
      webSocketFactory: socketFactory as any,

      // CONNECT 프레임 (서버가 사용하지 않더라도 유지 가능)
      connectHeaders: {
        'accept-version': '1.2,1.1,1.0',
        ...authHeaders(),
      } as any,

      heartbeatIncoming: 15000,
      heartbeatOutgoing: 15000,
      reconnectDelay: 3000,
      debug: (m) => console.log('[STOMP]', m),

      beforeConnect: () => {
        console.log('[STOMP] connecting…', {
          endpoint: sockUrlWithToken(currentToken!),
        });
      },

      onConnect: (frame) => {
        console.log('[STOMP] CONNECTED:', frame.headers);
        triedRefreshOnClose = false;
        isActive = true;
      },

      onStompError: (frame) => {
        console.warn(
          '[STOMP] STOMP ERROR:',
          frame.headers?.message,
          frame.body
        );
      },

      onWebSocketError: (e) => {
        console.warn('[STOMP] WS ERROR:', e);
      },

      onWebSocketClose: async (evt) => {
        console.warn(
          '[STOMP] WS CLOSED:',
          evt?.code,
          evt?.reason || '(no reason)'
        );
        isActive = false;

        // 최초 1회 토큰 리프레시 후 재접속 시도
        if (!triedRefreshOnClose) {
          triedRefreshOnClose = true;
          try {
            console.log('🔄 토큰 갱신 시도...');
            const ok = await refreshAccessToken();
            if (ok) {
              currentToken = await getAccessToken();
              const c = ensureClient();

              // 새 토큰으로 URL 갱신을 위해 재활성화
              try {
                await c.deactivate();
              } catch {}
              isActive = false;
              triedRefreshOnClose = false;
              c.webSocketFactory = () =>
                new SockJS(sockUrlWithToken(currentToken!), null, {
                  transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
                  sessionId: makeSessionId,
                });
              c.connectHeaders = {
                ...(c.connectHeaders || {}),
                ...authHeaders(),
              } as any;
              c.activate();
              return;
            } else {
              // 토큰 갱신 실패 시 조용히 처리 (앱이 튕기지 않도록)
              console.log('⚠️ 토큰 갱신 실패, 자동 재연결 시도합니다');
            }
          } catch (e: any) {
            // 에러를 조용히 처리 (앱이 튕기지 않도록)
            if (__DEV__) {
              console.warn('🔄 토큰 갱신 중 에러 (조용히 처리):', e?.message || e);
            } else {
              console.log('⚠️ 토큰 갱신 중 일시적 오류, 자동 재연결 시도합니다');
            }
          }
        }
        // 이후 재연결은 stomp-js의 reconnectDelay에 맡김
      },
    });

    // 1회 연결 대기(최대 15초)
    const waitOnce = new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⏰ STOMP connect wait timeout (auto-retry in background)');
        resolve();
      }, 15000);

      const originalOnConnect = client!.onConnect;
      client!.onConnect = (f) => {
        clearTimeout(timeout);
        originalOnConnect?.(f);
        resolve();
      };
    });

    try {
      if (!isActive) client.activate();
    } catch (e) {
      console.warn('[STOMP] activate() threw:', e);
    }

    await waitOnce;
  })();

  try {
    await connectingPromise;
  } finally {
    connectingPromise = null;
  }
}

export async function disconnectSock() {
  const c = ensureClient();
  try {
    Object.values(subs).forEach((s) => s.unsubscribe());
  } catch {}
  subs = {};
  triedRefreshOnClose = false;
  isActive = false;
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
    console.warn('[STOMP] Not connected yet, waiting…');
    let cancelled = false;
    const tryLater = () => {
      if (cancelled) return;
      if (c.connected) {
        const unsub = subscribeRoomSock(roomId, onMessage);
        return;
      }
      setTimeout(tryLater, 500);
    };
    tryLater();
    return () => {
      cancelled = true;
    };
  }

  if (subs[String(roomId)]) {
    try {
      subs[String(roomId)].unsubscribe();
    } catch {}
    delete subs[String(roomId)];
  }

  const destination = `${SUB_PREFIX}${roomId}`;
  console.log('[STOMP] SUBSCRIBE:', destination);

  const sub = c.subscribe(
    destination,
    (msg) => {
      try {
        onMessage(JSON.parse(msg.body) as ChatMessage, msg);
      } catch (e) {
        console.warn('[STOMP] message parse failed, delivering raw text');
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
      // CONNECT가 성립된 뒤의 프레임에는 Authorization을 덧붙여도 OK
      ...authHeaders(),
    } as any
  );

  subs[String(roomId)] = sub;
  return () => {
    try {
      sub.unsubscribe();
    } catch {}
    delete subs[String(roomId)];
  };
}

export function subscribeRoomReadBoundary(
  roomId: number,
  onUpdate: (update: ReadBoundaryUpdate) => void
): () => void {
  const c = ensureClient();

  if (!c.connected) {
    console.warn('[STOMP] Not connected yet, waiting (read)…');
    let cancelled = false;
    const tryLater = () => {
      if (cancelled) return;
      if (c.connected) {
        const unsub = subscribeRoomReadBoundary(roomId, onUpdate);
        return;
      }
      setTimeout(tryLater, 500);
    };
    tryLater();
    return () => {
      cancelled = true;
    };
  }

  const destination = `${SUB_PREFIX}${roomId}/read`;
  console.log('[STOMP] SUBSCRIBE(read):', destination);

  const sub = c.subscribe(
    destination,
    (msg) => {
      try {
        onUpdate(JSON.parse(msg.body) as ReadBoundaryUpdate);
      } catch (e) {
        console.warn('[STOMP] read-boundary parse failed:', e);
      }
    },
    { ...authHeaders(), id: `sub-read-${roomId}-${Date.now()}` } as any
  );

  return () => {
    try {
      sub.unsubscribe();
    } catch {}
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
        .slice(2, 9)}`,
    }),
  });
}

export function sendImageSock(
  roomId: number,
  fileName: string,
  fileIds: number[],
  fileSize?: number
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
      fileSize,
      clientMessageId: `client_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 9)}`,
    }),
  });
}

export function sendFileSock(
  roomId: number,
  fileName: string,
  fileIds: number[],
  fileSize?: number
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
      fileSize,
      clientMessageId: `client_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 9)}`,
    }),
  });
}

// ====== 상태 헬퍼 ======
export function isConnected(): boolean {
  return client?.connected === true;
}

export async function waitForConnection(timeoutMs = 10000): Promise<boolean> {
  if (isConnected()) return true;
  const start = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      if (isConnected()) return resolve(true);
      if (Date.now() - start > timeoutMs) {
        console.warn('[STOMP] waitForConnection timeout');
        return resolve(false);
      }
      setTimeout(tick, 100);
    };
    tick();
  });
}

export async function connectAndSubscribeSock(
  roomId: number,
  onMessage: (m: ChatMessage, raw: IMessage) => void,
  token?: string
): Promise<() => void> {
  await connectSock(token);
  const c = ensureClient();
  if (!c.connected) {
    const ok = await waitForConnection(15000);
    if (!ok)
      console.warn(
        '[STOMP] connectAndSubscribe: connection not ready (will still try subscribe)'
      );
  }
  return subscribeRoomSock(roomId, onMessage);
}
// ✅ stompClient.ts 하단에 추가

let ensureOncePromise: Promise<boolean> | null = null;

/**
 * JWT가 존재할 때 STOMP 연결을 한 번만 안전하게 시도하고,
 * 연결이 완료되면 true, 실패 시 false 반환.
 */
export async function ensureConnectedOnce(
  jwt: string,
  timeoutMs = 12000
): Promise<boolean> {
  // 이미 연결되어 있으면 OK
  if (client?.connected) return true;

  // 동시에 여러 번 호출될 때 중복 방지
  if (!ensureOncePromise) {
    ensureOncePromise = (async () => {
      try {
        console.log('[WS] ensureConnectedOnce() called');
        // 실제 connect 호출
        await connectSock(jwt);

        // 연결 완료까지 대기
        const ok = await waitForConnection(timeoutMs);
        if (ok) {
          console.log('[WS] ✅ Connected successfully');
          return true;
        }

        // 첫 시도 실패 시, 한 번 강제 재시도
        console.warn('[WS] ⚠️ First connect attempt failed, retrying...');
        try {
          await disconnectSock();
        } catch {}
        await connectSock(jwt);
        const retryOk = await waitForConnection(timeoutMs);
        console.log('[WS] Retry result:', retryOk);
        return retryOk;
      } catch (e) {
        console.error('[WS] ❌ ensureConnectedOnce() failed:', e);
        return false;
      } finally {
        // 완료 후 promise 초기화 (다음 호출을 허용)
        ensureOncePromise = null;
      }
    })();
  }

  return ensureOncePromise;
}

/**
 * (선택) 현재 STOMP 연결 상태를 쉽게 확인하기 위한 헬퍼
 */
export function getDebugState() {
  return {
    hasClient: !!client,
    connected: client?.connected ?? false,
    isActive,
    hasToken: !!currentToken,
  };
}
