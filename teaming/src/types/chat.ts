export interface Message {
  id: number;
  text: string;
  user: string;
  userImage?: any;
  timestamp: string;
  isMe: boolean;
  readCount: number;
}

export interface ChatRoom {
  id: number;
  title: string;
  subtitle: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  members: any;
  memberCount: string;
}

export interface ChatRoomData {
  id: number;
  title: string;
  subtitle: string;
  members: any;
  memberCount: string;
}

export interface Team {
  id: number;
  title: string;
  subtitle: string;
  time?: string;
  members: any;
  memberCount?: string;
  roomType?: string;
  price?: string;
  benefit?: string;
}
