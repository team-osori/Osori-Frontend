/**
 * 화면 경로(해시) 정의. 사이드바, 프로젝트 목록, 각 화면의 이전/다음 버튼이 모두 여기를 기준으로 이동합니다.
 * 라우터 라이브러리를 도입하면 이 파일만 바꾸면 됩니다.
 */

export const ROUTES = {
  login: '/login',
  signup: '/signup',
  projects: '/projects',
  /** 앱 전체 설정 (내 계정 · 멤버 · 인스턴스) */
  accountSettings: '/account-settings',
  /** 프로젝트 설정 (일반 · 서비스 연결 · 프롬프트 · 채점자) */
  projectSettings: '/settings',

  /* 평가 단계 화면 */
  questions: '/questions',
  scoring: '/scoring',
  wrongNotes: '/wrong-notes',
  abRun: '/ab-run',
  grading: '/grading',
  judge: '/judge',
  diagnosis: '/diagnosis',
  improvement: '/improvement',
} as const

export type StageScreen = { route: string; label: string }

export type Stage = {
  label: string
  /** 사이드바 단계 아래 작은 글씨 */
  hint: string
  /** 단계 안의 화면들. 첫 화면이 단계의 시작 화면 */
  screens: StageScreen[]
}

/** 평가 3단계. 배열 순서가 곧 단계 번호(1~3)입니다. */
export const STAGES: Stage[] = [
  {
    label: '시험지 만들기',
    hint: '정책 문서로 문제를 만들고 검토',
    screens: [{ route: ROUTES.questions, label: '시험지' }],
  },
  {
    label: '채점',
    hint: '챗봇 답을 O / X로 채점',
    screens: [
      { route: ROUTES.scoring, label: '채점' },
      { route: ROUTES.abRun, label: 'A/B 실행' },
      { route: ROUTES.grading, label: '채점 결과' },
      { route: ROUTES.judge, label: '사람 판정' },
    ],
  },
  {
    label: '오답 노트',
    hint: '틀린 이유를 보고 프롬프트 고치기',
    screens: [
      { route: ROUTES.wrongNotes, label: '오답 노트' },
      { route: ROUTES.diagnosis, label: '원인 진단' },
      { route: ROUTES.improvement, label: '개선안 적용' },
    ],
  },
]

/** 1부터 시작하는 단계의 시작 화면 경로. 범위를 벗어나면 undefined */
export function stageRoute(stage: number): string | undefined {
  return STAGES[stage - 1]?.screens[0].route
}

/** 현재 경로가 몇 단계 화면인지(1~3). 평가 화면이 아니면 undefined */
export function stageOf(route: string): number | undefined {
  const index = STAGES.findIndex((s) => s.screens.some((screen) => screen.route === route))
  return index === -1 ? undefined : index + 1
}
