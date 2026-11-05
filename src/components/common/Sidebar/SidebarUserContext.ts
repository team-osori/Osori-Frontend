import { createContext, useContext } from 'react'
import type { UserMenuActions } from '../UserMenu/UserMenu'

/**
 * 로그인한 사용자와 계정 메뉴 동작. App이 내려주면 모든 사이드바 하단 프로필이 이 값을 씁니다.
 * (화면마다 넘기는 user · userMenu보다 우선)
 */
export type SidebarUser = {
  name: string
  /** 계정 메뉴에 이름 아래로 보여줄 계정 표시 (아이디) */
  account: string
  menu: UserMenuActions
}

export const SidebarUserContext = createContext<SidebarUser | null>(null)

export function useSidebarUser() {
  return useContext(SidebarUserContext)
}
