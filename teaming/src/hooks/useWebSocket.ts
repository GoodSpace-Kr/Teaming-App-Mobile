// useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  connectSock,
  subscribeRoomSock,
  sendTextSock,
  sendImageSock,
  sendFileSock,
  disconnectSock,
  type ChatMessage,
} from '../services/stompClient';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  jwt: string;
  roomId?: number;
  autoConnect?: boolean;
}

interface UseWebSocketReturn {
  status: WebSocketStatus;
  isConnected: boolean;
  messages: ChatMessage[];
  unreadCount: number;
  lastReadMessageId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTextMessage: (content: string) => void;
  sendImageMessage: (
    content: string | null,
    attachmentFileIds: number[]
  ) => void;
  sendFileMessage: (
    content: string | null,
    attachmentFileIds: number[]
  ) => void;
  error: string | null;
}

export const useWebSocket = ({
  jwt,
  roomId,
  autoConnect = true,
}: UseWebSocketOptions): UseWebSocketReturn => {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // 웹소켓 연결 및 구독
  useEffect(() => {
    if (!jwt || jwt.trim() === '' || !roomId) {
      console.warn(
        '⚠️ JWT 토큰 또는 roomId가 없어 웹소켓 연결을 시도하지 않습니다.'
      );
      return;
    }

    if (!autoConnect) return;

    console.log('🔧 웹소켓 연결 시작:', {
      jwtLength: jwt.length,
      jwtPrefix: jwt.substring(0, 20) + '...',
      roomId,
    });

    setStatus('connecting');
    setError(null);

    const connectAndSubscribe = async () => {
      try {
        const unsubscribe = await subscribeRoomSock(roomId, (message) => {
          console.log('📨 새 메시지 수신:', message);
          setMessages((prev) => [...prev, message]);
        });

        unsubscribeRef.current = unsubscribe;
        setStatus('connected');
        console.log('✅ 웹소켓 연결 및 구독 완료');
      } catch (err) {
        console.error('❌ 웹소켓 연결 실패:', err);
        setStatus('error');
        setError('웹소켓 연결에 실패했습니다.');
      }
    };

    connectAndSubscribe();

    return () => {
      console.log('🧹 웹소켓 정리 중...');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      disconnectSock();
    };
  }, [jwt, roomId, autoConnect]);

  const connect = useCallback(async () => {
    if (!jwt || !roomId) return;

    try {
      setError(null);
      setStatus('connecting');

      const unsubscribe = await subscribeRoomSock(roomId, (message) => {
        console.log('📨 새 메시지 수신:', message);
        setMessages((prev) => [...prev, message]);
      });

      unsubscribeRef.current = unsubscribe;
      setStatus('connected');
    } catch (err) {
      console.error('웹소켓 연결 실패:', err);
      setError('웹소켓 연결에 실패했습니다.');
      setStatus('error');
    }
  }, [jwt, roomId]);

  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    disconnectSock();
    setStatus('disconnected');
  }, []);

  const sendTextMessage = useCallback(
    (content: string) => {
      console.log('📤 텍스트 메시지 전송 시도:', {
        content,
        roomId,
        status,
      });

      if (roomId) {
        try {
          sendTextSock(roomId, content);
          console.log('🚀 메시지 전송 완료');
        } catch (err) {
          console.error('❌ 메시지 전송 실패:', err);
          setError('메시지 전송에 실패했습니다.');
        }
      }
    },
    [roomId, status]
  );

  const sendImageMessage = useCallback(
    (content: string | null, attachmentFileIds: number[]) => {
      if (roomId) {
        try {
          sendImageSock(roomId, content || '', attachmentFileIds);
        } catch (err) {
          console.error('❌ 이미지 메시지 전송 실패:', err);
          setError('이미지 메시지 전송에 실패했습니다.');
        }
      }
    },
    [roomId]
  );

  const sendFileMessage = useCallback(
    (content: string | null, attachmentFileIds: number[]) => {
      if (roomId) {
        try {
          sendFileSock(roomId, content || '', attachmentFileIds);
        } catch (err) {
          console.error('❌ 파일 메시지 전송 실패:', err);
          setError('파일 메시지 전송에 실패했습니다.');
        }
      }
    },
    [roomId]
  );

  return {
    status,
    isConnected: status === 'connected',
    messages,
    unreadCount,
    lastReadMessageId,
    connect,
    disconnect,
    sendTextMessage,
    sendImageMessage,
    sendFileMessage,
    error,
  };
};
