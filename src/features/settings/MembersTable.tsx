import { Avatar, Select, type SelectOption } from '../../components/ui'
import { cx } from '../../lib/cx'
import type { Member, MemberRole } from './types'
import styles from './MembersTable.module.css'

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'admin', label: '어드민' },
  { value: 'member', label: '멤버' },
]

type MembersTableProps = {
  members: Member[]
  onRoleChange: (id: string, role: MemberRole) => void
  onResendInvite?: (member: Member) => void
  onCancelInvite: (member: Member) => void
  onOpenMenu?: (member: Member) => void
}

/** 멤버 목록 표. 본인은 역할을 바꿀 수 없고, 초대 대기 멤버는 다시 보내기 · 취소를 할 수 있습니다. */
export function MembersTable({ members, onRoleChange, onResendInvite, onCancelInvite, onOpenMenu }: MembersTableProps) {
  return (
    <div className={styles.card}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <colgroup>
            <col className={styles.colAvatar} />
            <col className={styles.colName} />
            <col className={styles.colEmail} />
            <col className={styles.colRole} />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">
                <span className={styles.srOnly}>프로필</span>
              </th>
              <th scope="col">이름</th>
              <th scope="col">이메일</th>
              <th scope="col">역할</th>
              <th scope="col">마지막 접속</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onRoleChange={onRoleChange}
                onResendInvite={onResendInvite}
                onCancelInvite={onCancelInvite}
                onOpenMenu={onOpenMenu}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MemberRow({
  member,
  onRoleChange,
  onResendInvite,
  onCancelInvite,
  onOpenMenu,
}: { member: Member } & Omit<MembersTableProps, 'members'>) {
  const label = member.name ?? '초대 대기'

  return (
    <tr>
      <td className={styles.avatarCell}>
        {member.pending ? <span className={styles.pendingAvatar} aria-hidden /> : <Avatar name={label} size="sm" />}
      </td>
      <td>
        <span className={cx(styles.name, member.pending && styles.muted)}>{label}</span>
        {member.isMe && <span className={styles.me}> (나)</span>}
      </td>
      <td className={cx(styles.email, member.pending && styles.emailPending)}>{member.email}</td>
      <td>
        {member.isMe ? (
          <span className={styles.adminRole}>어드민</span>
        ) : (
          <Select
            size="row"
            ariaLabel={`${label} 역할`}
            options={ROLE_OPTIONS}
            value={member.role}
            onChange={(value) => onRoleChange(member.id, value as MemberRole)}
          />
        )}
      </td>
      <td>
        {member.pending ? (
          <div className={styles.actions}>
            <button type="button" className={styles.rowButton} onClick={() => onResendInvite?.(member)}>
              다시 보내기
            </button>
            <button
              type="button"
              className={cx(styles.rowButton, styles.rowButtonDanger)}
              onClick={() => onCancelInvite(member)}
              aria-label={`${member.email} 초대 취소`}
            >
              취소
            </button>
          </div>
        ) : (
          <div className={styles.lastSeen}>
            <span>{member.lastSeen}</span>
            {!member.isMe && (
              <button
                type="button"
                className={styles.more}
                onClick={() => onOpenMenu?.(member)}
                aria-label={`${label} 관리 메뉴`}
              >
                ···
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}
