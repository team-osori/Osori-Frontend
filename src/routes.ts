/**
 * 화면 경로(해시) 정의. 사이드바, 프로젝트 카드, 각 화면의 이전/다음 버튼이 모두 여기를 기준으로 이동합니다.
 * 라우터 라이브러리를 도입하면 이 파일만 바꾸면 됩니다.
 */

/** 평가 단계(1~7)와 경로. 배열 순서가 곧 단계 번호입니다. */
export const STEP_ROUTES = [
  '/connection', // 1 연결 설정
  '/questions', // 2 질문 세트
  '/ab-run', // 3 프롬프트 A/B 실행
  '/grading', // 4 자동 채점 결과
  '/judge', // 5 사람 판정
  '/diagnosis', // 6 원인 진단
  '/improvement', // 7 개선안 적용
] as const

export const ROUTES = {
  login: '/login',
  signup: '/signup',
  projects: '/projects',
  /** 앱 전체 설정 (내 계정 · 멤버 · 인스턴스) */
  accountSettings: '/account-settings',
  /** 프로젝트 설정 (일반 · 서비스 연결 · 채점자 · 멤버) */
  projectSettings: '/settings',
} as const

/** 1부터 시작하는 단계 번호의 경로. 범위를 벗어나면 undefined */
export function stepRoute(step: number): string | undefined {
  return STEP_ROUTES[step - 1]
}

/** 현재 경로가 몇 단계 화면인지. 평가 화면이 아니면 undefined */
export function stepOf(route: string): number | undefined {
  const index = STEP_ROUTES.indexOf(route as (typeof STEP_ROUTES)[number])
  return index === -1 ? undefined : index + 1
}
