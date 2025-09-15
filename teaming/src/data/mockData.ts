import { ChatRoom, Message, Team } from '../types/chat';

// 목 채팅방 데이터
export const mockChatRooms: ChatRoom[] = [
  {
    id: 1,
    title: '정치학 발표',
    subtitle: '정치학개론',
    lastMessage: '설명 읽으셨는지 모르겠지만 저희 벌칙 있는거 아시죠..?',
    lastMessageTime: '오후 8:52',
    unreadCount: 2,
    members: require('../../assets/images/(beforeLogin)/bluePeople.png'),
    memberCount: '3/4명',
  },
  {
    id: 2,
    title: '마케팅',
    subtitle: '디지털마케',
    lastMessage: '내일 회의 준비 잘 해주세요!',
    lastMessageTime: '오후 7:30',
    unreadCount: 0,
    members: require('../../assets/images/(beforeLogin)/purplePeople.png'),
    memberCount: '4/4명',
  },
];

// 목 메시지 데이터
export const mockMessages: { [roomId: number]: Message[] } = {
  1: [
    {
      id: 1,
      text: '이번 프로젝트에서 팀장을 맡게된 최순조라고 합니다. 반갑습니다.',
      user: '팀장 최순조',
      userImage: require('../../assets/images/(beforeLogin)/bluePeople.png'),
      timestamp: '오후 8:51',
      isMe: false,
      readCount: 1,
    },
    {
      id: 2,
      text: '제가 과제 하나 설정해했는데요 확인하시는 대로 답장 부탁드립니다.',
      user: '팀장 최순조',
      userImage: require('../../assets/images/(beforeLogin)/bluePeople.png'),
      timestamp: '오후 8:52',
      isMe: false,
      readCount: 1,
    },
    {
      id: 3,
      text: '네 확인했습니다.',
      user: '나',
      timestamp: '오후 8:52',
      isMe: true,
      readCount: 1,
    },
    {
      id: 4,
      text: '비교정치학 책 읽고 3장 요약 하면 되는거 맞겠죠?',
      user: '정치학존잘남',
      userImage: require('../../assets/images/(beforeLogin)/purplePeople.png'),
      timestamp: '오후 8:52',
      isMe: false,
      readCount: 1,
    },
    {
      id: 5,
      text: '아니',
      user: '정치학존잘남',
      userImage: require('../../assets/images/(beforeLogin)/purplePeople.png'),
      timestamp: '오후 8:54',
      isMe: false,
      readCount: 1,
    },
    {
      id: 6,
      text: '좀 에바긴한데.. 페이지 보셨나요 ㅋㅋㅋ',
      user: '정치학존잘남',
      userImage: require('../../assets/images/(beforeLogin)/purplePeople.png'),
      timestamp: '오후 8:54',
      isMe: false,
      readCount: 1,
    },
    {
      id: 7,
      text: '설명 읽으셨는지 모르겠지만 저희 벌칙 있는거 아시죠..?',
      user: '팀장 최순조',
      userImage: require('../../assets/images/(beforeLogin)/bluePeople.png'),
      timestamp: '오후 8:52',
      isMe: false,
      readCount: 1,
    },
  ],
  2: [
    {
      id: 1,
      text: '안녕하세요! 마케팅 프로젝트 팀입니다.',
      user: '마케팅팀장',
      userImage: require('../../assets/images/(beforeLogin)/purplePeople.png'),
      timestamp: '오후 6:30',
      isMe: false,
      readCount: 1,
    },
    {
      id: 2,
      text: '내일 회의 준비 잘 해주세요!',
      user: '마케팅팀장',
      userImage: require('../../assets/images/(beforeLogin)/purplePeople.png'),
      timestamp: '오후 7:30',
      isMe: false,
      readCount: 1,
    },
  ],
};

// 목 팀 데이터
export const mockTeams: Team[] = [
  {
    id: 1,
    title: '정치학 발표',
    subtitle: '정치학개론',
    time: '회의 오늘 18:00',
    members: require('../../assets/images/(beforeLogin)/bluePeople.png'),
    memberCount: '3/4명',
  },
  {
    id: 2,
    title: '마케팅',
    subtitle: '디지털마케',
    members: require('../../assets/images/(beforeLogin)/purplePeople.png'),
    memberCount: '4/4명',
  },
];
