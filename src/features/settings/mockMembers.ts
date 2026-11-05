import type { Member } from './types'

/** API 연동 전까지 쓰는 Figma 샘플 데이터 */
export const MOCK_MEMBERS: Member[] = [
  { id: 'kim-qa', name: '김QA', email: 'qa@moamall.co.kr', role: 'admin', isMe: true, lastSeen: '지금' },
  { id: 'park-pm', name: '박PM', email: 'pm@moamall.co.kr', role: 'member', lastSeen: '2시간 전' },
  { id: 'lee-dev', name: '이개발', email: 'dev@moamall.co.kr', role: 'member', lastSeen: '어제' },
  { id: 'invite-cs', name: null, email: 'cs@moamall.co.kr', role: 'member', pending: true },
]
