import { createContext, useContext } from 'react'

/** AppLayout이 제공하는 사이드바 접기/닫기 동작 */
export const SidebarContext = createContext<{ toggle: () => void } | null>(null)

export function useSidebarToggle() {
  return useContext(SidebarContext)?.toggle
}
