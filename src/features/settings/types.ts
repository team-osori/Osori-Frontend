export type MemberRole = 'admin' | 'member'

export type Member = {
  id: string
  /** 초대만 보내고 아직 가입하지 않은 멤버는 이름이 없음 */
  name: string | null
  email: string
  role: MemberRole
  /** 초대 대기 중이면 true */
  pending?: boolean
  /** 로그인한 본인 */
  isMe?: boolean
  /** 마지막 접속 (예: 지금, 2시간 전, 어제) */
  lastSeen?: string
}
