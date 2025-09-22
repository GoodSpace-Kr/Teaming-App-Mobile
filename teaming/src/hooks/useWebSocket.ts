// useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  WebSocketService,
  WebSocketStatus,
  ChatMessage,
  ReadBoundaryUpdate,
  UserError,
  UserRoomEvent,
} from '../services/websocketService';

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

  const wsServiceRef = useRef<WebSocketService | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // 웹소켓 서비스 초기화
  useEffect(() => {
    if (!jwt) return;

    wsServiceRef.current = new WebSocketService(jwt);

    // 상태 변경 리스너 등록
    unsubscribeRef.current = wsServiceRef.current.onStatusChange(
      (newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'error') {
          setError('웹소켓 연결에 문제가 발생했습니다.');
        } else {
          setError(null);
        }
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
    };
  }, [jwt]);

  // 자동 연결
  useEffect(() => {
    if (autoConnect && wsServiceRef.current && status === 'disconnected') {
      connect();
    }
  }, [autoConnect, status]);

  // 채팅방 구독
  useEffect(() => {
    if (wsServiceRef.current && roomId && status === 'connected') {
      wsServiceRef.current.subscribeToRoom(roomId, {
        onMessage: (message) => {
          console.log('📨 새 메시지 수신:', message);
          setMessages((prev) => [...prev, message]);
        },
        onReadBoundary: (update) => {
          console.log('📖 읽음 경계 업데이트:', update);
          setUnreadCount(update.unreadCount);
          setLastReadMessageId(update.lastReadMessageId);
        },
      });

      // 개인 큐 구독
      wsServiceRef.current.subscribeToUserQueues({
        onUserError: (error) => {
          console.error('❌ 사용자 에러:', error);
          setError(error.message);
        },
        onUserRoomEvent: (event) => {
          console.log('🔔 방 이벤트:', event);
          if (event.roomId === roomId) {
            setUnreadCount(event.unreadCount);
          }
        },
      });
    }
  }, [roomId, status]);

  const connect = useCallback(async () => {
    if (!wsServiceRef.current) return;

    try {
      setError(null);
      await wsServiceRef.current.connect();
    } catch (err) {
      console.error('웹소켓 연결 실패:', err);
      setError('웹소켓 연결에 실패했습니다.');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
    }
  }, []);

  const sendTextMessage = useCallback(
    (content: string) => {
      if (wsServiceRef.current && roomId) {
        wsServiceRef.current.sendTextMessage(roomId, content);
      }
    },
    [roomId]
  );

  const sendImageMessage = useCallback(
    (content: string | null, attachmentFileIds: number[]) => {
      if (wsServiceRef.current && roomId) {
        wsServiceRef.current.sendImageMessage(
          roomId,
          content,
          attachmentFileIds
        );
      }
    },
    [roomId]
  );

  const sendFileMessage = useCallback(
    (content: string | null, attachmentFileIds: number[]) => {
      if (wsServiceRef.current && roomId) {
        wsServiceRef.current.sendFileMessage(
          roomId,
          content,
          attachmentFileIds
        );
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
