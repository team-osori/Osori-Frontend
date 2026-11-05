import { useState } from 'react'
import { NavItem, PageHeader, Sidebar, SidebarList, SidebarTitle, type HomeMenu, type UserMenuActions } from '../../components/common'
import { Button } from '../../components/ui'
import { MembersTable, type Member, type MemberRole } from '../../features/settings'
import { AppLayout } from '../../layouts/AppLayout'
import type { CurrentUser } from '../../types/project'
import styles from './SettingsPage.module.css'

type SettingsTab = 'account' | 'members' | 'instance'

const TABS: Array<{ value: SettingsTab; label: string }> = [
  { value: 'account', label: '내 계정' },
  { value: 'members', label: '멤버' },
  { value: 'instance', label: '인스턴스' },
]

type SettingsPageProps = {
  user: CurrentUser
  /** 예전 API 호환용 (지금은 쓰지 않음) */
  projectCount?: number
  members: Member[]
  onMembersChange: (members: Member[]) => void
  onNavigate?: (menu: HomeMenu) => void
  userMenu?: UserMenuActions
  initialTab?: SettingsTab
}

/** 15 설정 · 멤버 */
export function SettingsPage({
  user,
  members,
  onMembersChange,
  onNavigate,
  userMenu,
  initialTab = 'members',
}: SettingsPageProps) {
  const [tab, setTab] = useState<SettingsTab>(initialTab)

  // TODO: 멤버 API 연동. 지금은 화면 안에서만 반영
  const changeRole = (id: string, role: MemberRole) =>
    onMembersChange(members.map((m) => (m.id === id ? { ...m, role } : m)))
  const cancelInvite = (member: Member) => onMembersChange(members.filter((m) => m.id !== member.id))

  return (
    <AppLayout
      sidebar={
        <Sidebar active="settings" user={user} userMenu={userMenu} onNavigate={onNavigate}>
          <SidebarTitle>설정</SidebarTitle>
          <SidebarList label="설정 구분">
            {TABS.map((t) => (
              <NavItem key={t.value} label={t.label} active={tab === t.value} onClick={() => setTab(t.value)} />
            ))}
          </SidebarList>
        </Sidebar>
      }
    >
      <div className={styles.page}>
        <PageHeader title={TABS.find((t) => t.value === tab)?.label ?? '설정'} />

        <div className={styles.panel}>
          {tab === 'members' ? (
            <>
              <div className={styles.toolbar}>
                <h2 className={styles.count}>멤버 {members.length}</h2>
                <Button size="xs" icon="plusSm">
                  멤버 초대
                </Button>
              </div>
              <MembersTable members={members} onRoleChange={changeRole} onCancelInvite={cancelInvite} />
            </>
          ) : (
            <p className={styles.placeholder}>준비 중인 화면입니다.</p>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
